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
    <div className="flex flex-col gap-2">
      {viewMode === "list" && (
        <div className="hidden sm:grid grid-cols-[48px_1fr_100px_140px_32px] px-4 py-2 gap-4 text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground/40 border-b border-border/5">
          <div />
          <div>Name</div>
          <div className="text-right">Size</div>
          <div className="text-right">Modified</div>
          <div />
        </div>
      )}

      <div
        className={cx(
          viewMode === "grid"
            ? [
                "grid",
                "grid-cols-[repeat(auto-fill,minmax(140px,1fr))]",
                "sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]",
                "gap-4",
                "content-start justify-items-center",
              ]
            : ["flex flex-col", "gap-1"],
        )}
      >
        {entries.map((child) => (
          <FileSystemEntry
            key={child.id}
            child={child}
            parentPath={path}
          />
        ))}
      </div>
    </div>
  );
});

ExplorerList.displayName = "ExplorerList";

export default ExplorerList;
