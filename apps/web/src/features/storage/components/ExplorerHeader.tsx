"use client";

import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";
import { ArrowLeft, ArrowRight, FolderIcon } from "lucide-react";
import useDriveStore from "../stores/drive.store";
import { useEffect } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { cx } from "class-variance-authority";
import { LayoutGrid, List } from "lucide-react";

const ExplorerHeader: React.FC = () => {
  const inputPath = useDriveStore((s) => s.inputPath);
  const setInputPath = useDriveStore((s) => s.setInputPath);
  const replace = useDriveStore((s) => s.replace);
  const goBack = useDriveStore((s) => s.goBack);
  const goForward = useDriveStore((s) => s.goForward);
  const viewMode = useDriveStore((s) => s.viewMode);
  const setViewMode = useDriveStore((s) => s.setViewMode);

  const canGoBack = useDriveStore((s) => s.historyIndex > 0);
  const canGoForward = useDriveStore(
    (s) => s.historyIndex < s.history.length - 1,
  );

  const debouncedPath = useDebouncedValue(inputPath, 500);

  useEffect(() => {
    replace(debouncedPath);
  }, [debouncedPath, replace]);

  return (
    <div className="w-full flex items-center gap-3 px-4 py-2 bg-background/70 backdrop-blur">
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canGoBack}
          className="h-8 w-8"
          onClick={goBack}
        >
          <ArrowLeft size={16} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          disabled={!canGoForward}
          className="h-8 w-8"
          onClick={goForward}
        >
          <ArrowRight size={16} />
        </Button>
      </div>

      {/* Path bar */}
      <div
        className={cx(
          "flex items-center gap-2 flex-1",
          "rounded-lg px-3 py-1.5",
          "bg-muted/40",
          "transition-colors",
          "focus-within:bg-muted/60",
        )}
      >
        <FolderIcon size={16} className="text-muted-foreground shrink-0" />

        <Input
          type="text"
          value={inputPath}
          placeholder="/"
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setInputPath(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") replace(inputPath);
          }}
          className="border-none shadow-none p-1 h-auto bg-transparent text-sm focus-visible:ring-0"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMode("grid")}
        >
          <LayoutGrid size={16} />
        </Button>

        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMode("list")}
        >
          <List size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ExplorerHeader;
