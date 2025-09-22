"use client";

import { Button } from "@client/components/ui/button";
import { ListDirectoryResponse } from "@shared/schemas/storage/response/folder.schema";
import { ForkKnifeCrossedIcon, Loader2Icon } from "lucide-react";
import useDriveStore from "../stores/driveStore";
import FolderWidget from "./FolderWidget";
import FileWidget from "./FileWidget";
import { UseMutationResult } from "@tanstack/react-query";
import { cx } from "class-variance-authority";
import { useEffect, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@client/components/ui/context-menu";
import NewFolderDialog from "./NewFolderDialog";

interface ExplorerContentProps {
  mutation: UseMutationResult<ListDirectoryResponse>;
}

const ExplorerContent: React.FC<ExplorerContentProps> = ({ mutation }) => {
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const { stack, stackIdx, path, setPath } = useDriveStore();
  const { isPending, error, mutate } = mutation;

  useEffect(() => {
    mutate({ path });
  }, [mutate]);

  function handleFolderClick(folderPath: string) {
    setPath(folderPath);
    mutate({ path: folderPath });
  }

  if (isPending) {
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
        <Button onClick={() => mutate({ path })} variant={"outline"}>
          Retry
        </Button>
      </div>
    );
  }

  const folder = stack[stackIdx];

  return (
    <div className="h-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cx(
              "grid grid-cols-4 align-center place-content-start",
              "place-items-center gap-2 h-full overflow-auto"
            )}
          >
            {folder?.children.map((child) => (
              <FolderWidget
                key={child.id}
                child={child}
                onClick={handleFolderClick}
              />
            ))}

            {folder?.files.map((child) => (
              <FileWidget key={child.id} child={child} />
            ))}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setShowFolderDialog(true)}>
            New Folder
          </ContextMenuItem>
          <ContextMenuItem>Upload</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <NewFolderDialog
        parentId={folder?.id}
        open={showFolderDialog}
        setOpen={setShowFolderDialog}
      />
    </div>
  );
};

export default ExplorerContent;
