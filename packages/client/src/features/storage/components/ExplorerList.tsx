"use client";

import { memo } from "react";
import FileSystemEntry from "./FileSystemEntry";
import { File, Folder } from "../types/storage.types";
import { cx } from "class-variance-authority";
import useDriveStore from "../stores/drive.store";

interface Props {
  entries: (File | Folder)[];
  path: string;
}

const ExplorerList = memo(({ entries, path }: Props) => {
  const viewMode = useDriveStore((s) => s.viewMode);

  return (
    <div
      className={cx(
        viewMode === "grid"
          ? [
              "grid",
              "grid-cols-[repeat(auto-fill,minmax(120px,1fr))]",
              "gap-4",
              "content-start justify-items-center",
            ]
          : ["flex flex-col", "gap-1"],
        "p-2",
      )}
    >
      {entries.map((child) => (
        <FileSystemEntry key={child.id} child={child} parentPath={path} />
      ))}
    </div>
  );
});

ExplorerList.displayName = "ExplorerList";

export default ExplorerList;
