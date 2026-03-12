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
import { useListDirectory } from "../hooks/useListDirectory";
import { useLongPress } from "@client/hooks/useLongPress";
import { useCopyMutation } from "../hooks/useCopyMutation";
import { useMoveMutation } from "../hooks/useMoveMutation";
import ExplorerList from "./ExplorerList";

const ExplorerContent: React.FC = () => {
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const path = useDriveStore((s) => s.path);
  const selectAll = useDriveStore((s) => s.selectAll);
  const clipboard = useDriveStore((s) => s.clipboard);

  const { isPending, data, error, refetch } = useListDirectory(path);

  const copyMutation = useCopyMutation(path);
  const moveMutation = useMoveMutation(path);

  const folder = data?.folder;

  const entries = useMemo(() => {
    if (!folder) return [];
    return [...folder.children, ...folder.files];
  }, [folder]);

  const emptyFolder = entries.length === 0;

  const { onTouchStart, onTouchEnd, onTouchMove } =
    useLongPress<HTMLDivElement>((x, y) => {
      const el = document.elementFromPoint(x, y);
      el?.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: x,
          clientY: y,
        }),
      );
    });

  const pasteHandler = useCallback(() => {
    if (!folder || clipboard.items.length === 0) return;

    if (clipboard.type === "copy") {
      copyMutation.mutate({
        destinationFolderId: folder.id,
        items: clipboard.items,
      });
      return;
    }

    moveMutation.mutate({
      destinationFolderId: folder.id,
      items: clipboard.items,
    });
  }, [clipboard, folder, copyMutation, moveMutation]);

  /* ---------------- Loading ---------------- */

  if (isPending || !folder) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2Icon className="animate-spin" size={36} />
        <p className="text-sm">Loading files...</p>
      </div>
    );
  }

  /* ---------------- Error ---------------- */

  if (error) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-4 text-center">
        <AlertTriangleIcon size={28} className="text-destructive" />
        <p className="text-sm text-muted-foreground">{error.message}</p>

        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="h-full overflow-hidden">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="h-full overflow-y-auto px-4 py-3"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchMove={onTouchMove}
          >
            {!emptyFolder ? (
              <ExplorerList entries={entries} path={path} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                <FolderPlusIcon size={36} />
                <div>
                  <p className="font-medium">This folder is empty</p>
                  <p className="text-sm">
                    Upload files or create a new folder to get started.
                  </p>
                </div>

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
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => setShowFolderDialog(true)}>
            <FolderPlusIcon size={16} className="mr-2" />
            New Folder
          </ContextMenuItem>

          <ContextMenuItem onClick={() => setShowUploadDialog(true)}>
            <UploadIcon size={16} className="mr-2" />
            Upload
          </ContextMenuItem>

          <ContextMenuItem
            onClick={pasteHandler}
            disabled={clipboard.items.length === 0}
          >
            Paste
          </ContextMenuItem>

          <ContextMenuItem onClick={() => selectAll(entries)}>
            Select All
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <NewFolderDialog
        parentId={folder.id}
        open={showFolderDialog}
        setOpen={setShowFolderDialog}
        parentPath={folder.fullPath}
      />

      <UploadDialog
        folderId={folder.id}
        open={showUploadDialog}
        setOpen={setShowUploadDialog}
        folderPath={folder.fullPath}
      />
    </div>
  );
};

export default ExplorerContent;
