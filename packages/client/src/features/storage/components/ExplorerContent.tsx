"use client";

import { Button } from "@client/components/ui/button";
import { ListDirectoryResponse } from "@shared/schemas/storage/response/folder.schema";
import { ArrowLeft, ForkKnifeCrossedIcon, Loader2Icon } from "lucide-react";
import { FaFile, FaFolder } from "react-icons/fa6";
import useDriveStore from "../stores/driveStore";
import { useListDirectory } from "../hooks/useListDirectory";
import { MouseEventHandler, useEffect } from "react";
import FolderWidget from "./FolderWidget";
import FileWidget from "./FileWidget";
import { cx } from "class-variance-authority";
import { UseMutationResult } from "@tanstack/react-query";

interface ExplorerContentProps {
  mutation: UseMutationResult<ListDirectoryResponse>;
}

const ExplorerContent: React.FC<ExplorerContentProps> = ({ mutation }) => {
  const { stack, stackIdx, path, setPath, push } = useDriveStore();
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
    <div>
      <div
        className={cx(
          "grid grid-flow-col align-center place-content-start",
          "place-items-center gap-2"
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
    </div>
  );
};

export default ExplorerContent;
