"use client";

import { FaFile, FaFolder } from "react-icons/fa6";
import { File, Folder } from "../types/storage.types";
import Image from "next/image";
import { useState } from "react";
import Preview from "./Preview";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@client/components/ui/context-menu";
import { cx } from "class-variance-authority";
import { useSelect } from "../hooks/useSelect";
import { isFolder } from "@client/lib/utils";
import useDriveStore from "../stores/driveStore";
import { useDeleteItems } from "../hooks/useDeleteItems";
import { toast } from "sonner";
import { getJob } from "../api/getJob";
import { useDownloadItems } from "../hooks/useDownloadItems";
import Rename from "./Rename";

interface FileSystemEntryProps {
  child: File | Folder;
  refetch: () => void;
}

const FileSystemEntry: React.FC<FileSystemEntryProps> = ({
  child,
  refetch,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const { selectedItems, isSelected, onSelect, selectItem } = useSelect();
  const { setPath, setClipboard, deselectAll } = useDriveStore();

  const thumbnailUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${child.userId}/thumbnails/${child.id}.webp`;

  const clickHandler = () => {
    if (selectedItems.length > 0) {
      onSelect(child);
      return;
    }

    if (isFolder(child)) {
      setPath(child.fullPath);
    } else {
      setShowPreview(true);
    }
  };

  const copyHandler = () => {
    if (isSelected(child)) {
      setClipboard({ type: "copy", items: selectedItems });
      return deselectAll();
    }

    setClipboard({
      type: "copy",
      items: [{ id: child.id, type: isFolder(child) ? "folder" : "file" }],
    });
    deselectAll();
  };

  const cutHandler = () => {
    if (isSelected(child)) {
      setClipboard({ type: "move", items: selectedItems });
      return deselectAll();
    }

    setClipboard({
      type: "move",
      items: [{ id: child.id, type: isFolder(child) ? "folder" : "file" }],
    });
    deselectAll();
  };

  const deleteMutation = useDeleteItems({
    onSuccess: (data) => {
      const toastId = `toast-${data.job.id}`;
      toast.loading("Delete job enqueued", { id: toastId });

      const interval = setInterval(async () => {
        try {
          const jobRes = await getJob(data.job.id);
          const status = jobRes.job.status;

          switch (status) {
            case "completed":
              toast.success("Files deleted successfully", { id: toastId });
              clearInterval(interval);
              refetch();
              break;

            case "processing":
              toast.loading(`Deleting files: ${jobRes.job.progress}%`, {
                id: toastId,
              });
              break;

            case "failed":
              toast.error("Some files failed to delete", { id: toastId });
              clearInterval(interval);
              refetch();
              break;

            default:
              toast.loading("Delete job enqueued", { id: toastId });
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

  const deleteHandler = async () => {
    if (isSelected(child)) {
      deleteMutation.mutate({
        items: selectedItems,
      });

      return deselectAll();
    }

    deleteMutation.mutate({
      items: [{ id: child.id, type: isFolder(child) ? "folder" : "file" }],
    });
  };

  const downloadZip = async (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "download.zip";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadMutation = useDownloadItems({
    onSuccess: (data) => {
      const toastId = `toast-${data.job.id}`;
      toast.loading("Zipping items for download", { id: toastId });

      const interval = setInterval(async () => {
        try {
          const jobRes = await getJob(data.job.id);
          const status = jobRes.job.status;
          const result = jobRes.job.result;

          switch (status) {
            case "completed":
              toast.success("Starting download", { id: toastId });
              clearInterval(interval);

              if (result) {
                downloadZip((result as { downloadLink: string }).downloadLink);
              }

              break;

            case "processing":
              toast.loading(`Zipping items: ${jobRes.job.progress}%`, {
                id: toastId,
              });
              break;

            case "failed":
              toast.error("Failed to create zip", { id: toastId });
              clearInterval(interval);
              refetch();
              break;

            default:
              toast.loading("Download job enqueued", { id: toastId });
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

  const downloadHandler = async () => {
    if (isSelected(child)) {
      downloadMutation.mutate({
        items: selectedItems,
      });

      return deselectAll();
    }

    downloadMutation.mutate({
      items: [{ id: child.id, type: isFolder(child) ? "folder" : "file" }],
    });
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            key={child.id}
            onClick={clickHandler}
            className={cx(
              "p-4 w-20 flex flex-col items-center justify-start gap-2",
              isSelected(child) && "bg-blue-400 rounded"
            )}
          >
            {isFolder(child) ? (
              <>
                <FaFolder size={56} className="text-yellow-400" />
                <p className="text-sm truncate w-full text-center">
                  {child.name}
                </p>
              </>
            ) : (
              <>
                {child.hasThumbnail ? (
                  <Image
                    width={56}
                    height={56}
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="object-cover h-[56px] w-[56px] rounded"
                  />
                ) : (
                  <FaFile size={56} className="text-neutral-200" />
                )}

                <p className="text-sm truncate w-full text-center">
                  {child.name}
                </p>
              </>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => setShowRename(true)}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => selectItem(child)}>
            Select
          </ContextMenuItem>
          <ContextMenuItem onClick={copyHandler}>Copy</ContextMenuItem>
          <ContextMenuItem onClick={cutHandler}>Cut</ContextMenuItem>
          <ContextMenuItem onClick={downloadHandler}>Download</ContextMenuItem>
          <ContextMenuItem onClick={deleteHandler}>Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Rename
        open={showRename}
        setOpen={setShowRename}
        item={child}
        refetch={refetch}
      />

      {!isFolder(child) && (
        <Preview open={showPreview} setOpen={setShowPreview} file={child} />
      )}
    </div>
  );
};

export default FileSystemEntry;
