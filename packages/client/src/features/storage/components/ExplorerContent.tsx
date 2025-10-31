"use client";

import { Button } from "@client/components/ui/button";
import { ForkKnifeCrossedIcon, Loader2Icon } from "lucide-react";
import useDriveStore from "../stores/driveStore";
import FileSystemEntry from "./FileSystemEntry";
import { cx } from "class-variance-authority";
import { useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@client/components/ui/context-menu";
import NewFolderDialog from "./NewFolderDialog";
import UploadDialog from "./UploadDialog";
import { useCopyItems } from "../hooks/useCopyItems";
import { toast } from "sonner";
import { getJob } from "../api/getJob";
import { useListDirectory } from "../hooks/useListDirectory";
import { useMoveItems } from "../hooks/useMoveItems";
import { useLongPress } from "@client/hooks/useLongPress";

const ExplorerContent: React.FC = () => {
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { path, push, stack, stackIdx, clipboard } = useDriveStore();
  const { isPending, data, error, refetch } = useListDirectory(path, true);
  const folder = data?.folder ?? stack[stackIdx];

  const { onTouchStart, onTouchEnd } = useLongPress<HTMLDivElement>((e) => {
    e.currentTarget.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: false,
        clientX: e.touches[0].clientX ?? 0,
        clientY: e.touches[0].clientY ?? 0,
      })
    );
  });

  useEffect(() => {
    if (!data) return;

    const currFolder = stack[stackIdx];
    const newFolder = data.folder;

    if (!currFolder || currFolder.id != newFolder.id) {
      push(data.folder);
    }
  }, [data]);

  const copyMutation = useCopyItems({
    onSuccess: (data) => {
      const toastId = `toast-${data.job.id}`;
      toast.loading("Copy job enqueued", { id: toastId });

      const interval = setInterval(async () => {
        try {
          const jobRes = await getJob(data.job.id);
          const status = jobRes.job.status;

          switch (status) {
            case "completed":
              toast.success("Files copied successfully", { id: toastId });
              clearInterval(interval);
              refetch();
              break;

            case "processing":
              toast.loading(`Copying files: ${jobRes.job.progress}%`, {
                id: toastId,
              });
              break;

            case "failed":
              toast.error("Some files failed to copy", { id: toastId });
              clearInterval(interval);
              refetch();
              break;

            default:
              toast.loading("Copy job enqueued", { id: toastId });
              break;
          }
        } catch {
          toast.error("Failed to fetch job status", { id: toastId });
          clearInterval(interval);
        }
      }, 1000);
    },
    onError: (err) => {},
  });

  const moveMutation = useMoveItems({
    onSuccess: (data) => {
      const toastId = `toast-${data.job.id}`;
      toast.loading("Move job enqueued", { id: toastId });

      const interval = setInterval(async () => {
        try {
          const jobRes = await getJob(data.job.id);
          const status = jobRes.job.status;

          switch (status) {
            case "completed":
              toast.success("Files moved successfully", { id: toastId });
              clearInterval(interval);
              refetch();
              break;

            case "processing":
              toast.loading(`Moving files: ${jobRes.job.progress}%`, {
                id: toastId,
              });
              break;

            case "failed":
              toast.error("Some files failed to move", { id: toastId });
              clearInterval(interval);
              refetch();
              break;

            default:
              toast.loading("Move job enqueued", { id: toastId });
              break;
          }
        } catch {
          toast.error("Failed to fetch job status", { id: toastId });
          clearInterval(interval);
        }
      }, 1000);
    },
    onError: (err) => {},
  });

  const pasteHandler = async () => {
    if (clipboard.type == "copy") {
      return copyMutation.mutate({
        destinationFolderId: folder.id,
        items: clipboard.items,
      });
    }

    moveMutation.mutate({
      destinationFolderId: folder.id,
      items: clipboard.items,
    });
  };

  if (isPending || folder == undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2Icon className="animate-spin" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-2">
        <ForkKnifeCrossedIcon /> <p>{error.message}</p>
        <Button onClick={() => refetch()} variant={"outline"}>
          Retry
        </Button>
      </div>
    );
  }

  const emptyFolder = folder.children.length == 0 && folder.files.length == 0;

  return (
    <div className="h-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {!emptyFolder ? (
            <div
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className={cx(
                "grid grid-cols-4 align-center place-content-start",
                "place-items-center gap-2 h-full overflow-auto"
              )}
            >
              {folder?.children.map((child) => (
                <FileSystemEntry
                  key={child.id}
                  child={child}
                  refetch={refetch}
                />
              ))}

              {folder?.files.map((child) => (
                <FileSystemEntry
                  key={child.id}
                  child={child}
                  refetch={refetch}
                />
              ))}
            </div>
          ) : (
            <div
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className="h-full flex justify-center items-center"
            >
              <p>Oops, there's nothing here. But you can add your files!</p>
            </div>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setShowFolderDialog(true)}>
            New Folder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setShowUploadDialog(true)}>
            Upload
          </ContextMenuItem>
          <ContextMenuItem onClick={pasteHandler}>Paste</ContextMenuItem>
          <ContextMenuItem onClick={pasteHandler}>Download</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <NewFolderDialog
        parentId={folder?.id}
        open={showFolderDialog}
        setOpen={setShowFolderDialog}
        refetch={refetch}
      />
      <UploadDialog
        folderId={folder?.id}
        open={showUploadDialog}
        setOpen={setShowUploadDialog}
        refetch={refetch}
      />
    </div>
  );
};

export default ExplorerContent;
