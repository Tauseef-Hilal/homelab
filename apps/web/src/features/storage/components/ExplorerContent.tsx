"use client";

import { Button } from "@client/components/ui/button";
import {
  FolderPlusIcon,
  UploadIcon,
  Loader2Icon,
  AlertTriangleIcon,
} from "lucide-react";

import useDriveStore from "../stores/drive.store";
import { useMemo, useState, useCallback } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@client/components/ui/context-menu";

import NewFolderDialog from "./NewFolderDialog";
import UploadDialog from "./UploadDialog";
import ExplorerList from "./ExplorerList";
import { useCopyItems } from "../hooks/useCopyItems";
import { invalidateQueries, pollJobData } from "@client/lib/utils";
import { toast } from "sonner";
import { useMoveItems } from "../hooks/useMoveItems";
import { useQueryClient } from "@tanstack/react-query";
import { useDriveContents } from "../hooks/useDriveContents";

const ExplorerContent: React.FC = () => {
  const queryClient = useQueryClient();

  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const path = useDriveStore((s) => s.path);
  const selectAll = useDriveStore((s) => s.selectAll);
  const clipboard = useDriveStore((s) => s.clipboard);
  const viewContext = useDriveStore((s) => s.viewContext);
  const shareToken = useDriveStore((s) => s.shareToken);

  const { isPending, data, error, refetch } = useDriveContents();

  const copyMutation = useCopyItems({
    onSuccess: (data) =>
      pollJobData(
        data.job.id,
        {
          processing: "Copying files",
          completed: "Files copied successfully",
          failed: "Failed to copy files",
        },
        () =>
          invalidateQueries(queryClient, [
            ["drive", viewContext, path],
            ["stats"],
          ]),
        () =>
          invalidateQueries(queryClient, [
            ["drive", viewContext, path],
            ["stats"],
          ]),
      ),
    onError: (err) => toast.error(err),
  });

  const moveMutation = useMoveItems({
    onSuccess: (data) =>
      pollJobData(
        data.job.id,
        {
          processing: "Moving files",
          completed: "Files moved successfully",
          failed: "Failed to move files",
        },
        () => invalidateQueries(queryClient, [["drive", viewContext, path]]),
        () => invalidateQueries(queryClient, [["drive", viewContext, path]]),
      ),
    onError: (err) => toast.error(err),
  });

  const folder = data?.folder;
  const entries = useMemo(() => {
    if (!folder) return [];
    return [...folder.children, ...folder.files];
  }, [folder]);

  const canWrite = folder?.permissions?.write ?? true;
  const emptyFolder = entries.length === 0;

  const pasteHandler = useCallback(() => {
    if (!folder || clipboard.items.length === 0) return;

    if (clipboard.type === "copy") {
      copyMutation.mutate({
        destinationFolderId: folder.id,
        items: clipboard.items,
        shareToken,
      });
      return;
    }

    moveMutation.mutate({
      destinationFolderId: folder.id,
      items: clipboard.items,
      shareToken,
    });
  }, [clipboard, folder, copyMutation, moveMutation]);

  /* ---------------- Error ---------------- */

  if (error) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-4 text-center">
        <AlertTriangleIcon size={28} className="text-destructive" />
        <p className="text-base sm:text-lg font-medium text-muted-foreground">
          {error.response?.status === 404 ? "Folder not found" : error.message}
        </p>

        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          Retry
        </Button>
      </div>
    );
  }

  /* ---------------- Loading ---------------- */

  if (isPending || !folder) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2Icon className="animate-spin" size={36} />
        <p className="text-base font-medium">Loading files...</p>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="h-full overflow-hidden">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="h-full overflow-y-auto px-4 pt-3 pb-8"
          >
            {!emptyFolder ? (
              <ExplorerList entries={entries} path={path} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                <FolderPlusIcon size={36} />
                <div>
                  <p className="font-medium">This folder is empty</p>
                  <p className="text-sm">
                    {canWrite
                      ? "Upload files or create a new folder to get started."
                      : "No items have been shared with you yet."}
                  </p>
                </div>

                {/* 3. Hide actions if the user doesn't have WRITE access */}
                {canWrite && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                      <UploadIcon size={16} className="mr-2" />
                      Upload
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFolderDialog(true)}
                    >
                      <FolderPlusIcon size={16} className="mr-2" />
                      New Folder
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          {/* 4. Disable Context Menu items based on permissions */}
          <ContextMenuItem
            onClick={() => setShowFolderDialog(true)}
            disabled={!canWrite}
          >
            <FolderPlusIcon size={16} className="mr-2" />
            New Folder
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => setShowUploadDialog(true)}
            disabled={!canWrite}
          >
            <UploadIcon size={16} className="mr-2" />
            Upload
          </ContextMenuItem>

          <ContextMenuItem
            onClick={pasteHandler}
            disabled={clipboard.items.length === 0 || !canWrite}
          >
            Paste
          </ContextMenuItem>

          <ContextMenuItem onClick={() => selectAll(entries)}>
            Select All
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Dialogs stay exactly the same */}
      <NewFolderDialog
        parentId={folder?.id}
        open={showFolderDialog}
        setOpen={setShowFolderDialog}
        parentPath={folder?.fullPath}
      />
      <UploadDialog
        folderId={folder?.id}
        open={showUploadDialog}
        setOpen={setShowUploadDialog}
        folderPath={folder?.fullPath}
      />
    </div>
  );
};

export default ExplorerContent;
