"use client";

import { Button } from "@client/components/ui/button";
import { ForkKnifeCrossedIcon, Loader2Icon } from "lucide-react";
import useDriveStore from "../stores/driveStore";
import FileSystemEntry from "./FileSystemEntry";
import { UseQueryResult } from "@tanstack/react-query";
import { cx } from "class-variance-authority";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@client/components/ui/context-menu";
import NewFolderDialog from "./NewFolderDialog";
import UploadDialog from "./UploadDialog";
import { ListDirectoryResponse } from "@shared/schemas/storage/response/folder.schema";
import { useCopyItems } from "../hooks/useCopyItems";

interface ExplorerContentProps {
  listQuery: UseQueryResult<ListDirectoryResponse>;
}

const ExplorerContent: React.FC<ExplorerContentProps> = ({ listQuery }) => {
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { stack, stackIdx, clipboard } = useDriveStore();
  const { isPending, error, refetch } = listQuery;
  const folder = stack[stackIdx];

  const copyMutation = useCopyItems({
    onSuccess: (data) => {},
    onError: (err) => {},
  });

  const pasteHandler = () => {
    copyMutation.mutate({ destinationFolderId: folder.id, items: clipboard });
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
              className={cx(
                "grid grid-cols-4 align-center place-content-start",
                "place-items-center gap-2 h-full overflow-auto"
              )}
            >
              {folder?.children.map((child) => (
                <FileSystemEntry key={child.id} child={child} />
              ))}

              {folder?.files.map((child) => (
                <FileSystemEntry key={child.id} child={child} />
              ))}
            </div>
          ) : (
            <div className="h-full flex justify-center items-center">
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
        </ContextMenuContent>
      </ContextMenu>
      <NewFolderDialog
        parentId={folder?.id}
        open={showFolderDialog}
        setOpen={setShowFolderDialog}
      />
      <UploadDialog
        folderId={folder?.id}
        open={showUploadDialog}
        setOpen={setShowUploadDialog}
      />
    </div>
  );
};

export default ExplorerContent;
