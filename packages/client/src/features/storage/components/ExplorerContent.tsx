"use client";

import { Button } from "@client/components/ui/button";
import { ForkKnifeCrossedIcon, Loader2Icon } from "lucide-react";
import useDriveStore from "../stores/driveStore";
import FolderWidget from "./FolderWidget";
import FileWidget from "./FileWidget";
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

interface ExplorerContentProps {
  listQuery: UseQueryResult<ListDirectoryResponse>;
}

const ExplorerContent: React.FC<ExplorerContentProps> = ({ listQuery }) => {
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { stack, stackIdx, setPath } = useDriveStore();
  const { isPending, error, refetch } = listQuery;
  const folder = stack[stackIdx];

  function handleFolderClick(folderPath: string) {
    setPath(folderPath);
  }

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
          <ContextMenuItem onClick={() => setShowUploadDialog(true)}>
            Upload
          </ContextMenuItem>
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
