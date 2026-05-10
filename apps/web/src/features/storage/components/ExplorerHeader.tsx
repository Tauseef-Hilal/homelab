"use client";

import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  FolderIcon,
  HardDriveIcon,
  UsersIcon,
  LayoutGrid,
  List,
} from "lucide-react";
import useDriveStore, { ViewContext } from "../stores/drive.store";
import { useEffect } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { cx } from "class-variance-authority";

const NAV_TABS: { id: ViewContext; label: string; icon: React.ElementType }[] =
  [
    { id: "personal", label: "My Drive", icon: HardDriveIcon },
    { id: "shared", label: "Shared with me", icon: UsersIcon },
    // { id: "recent", label: "Recent", icon: ClockIcon },
    // { id: "starred", label: "Starred", icon: StarIcon },
  ];

const ExplorerHeader: React.FC = () => {
  // Navigation State
  const inputPath = useDriveStore((s) => s.inputPath);
  const setInputPath = useDriveStore((s) => s.setInputPath);
  const navigate = useDriveStore((s) => s.navigate);
  const goBack = useDriveStore((s) => s.goBack);
  const goForward = useDriveStore((s) => s.goForward);

  // View State
  const viewMode = useDriveStore((s) => s.viewMode);
  const setViewMode = useDriveStore((s) => s.setViewMode);

  // Context State
  const viewContext = useDriveStore((s) => s.viewContext);

  const canGoBack = useDriveStore((s) => s.historyIndex > 0);
  const canGoForward = useDriveStore(
    (s) => s.historyIndex < s.history.length - 1,
  );

  const debouncedPath = useDebouncedValue(inputPath, 500);

  useEffect(() => {
    // Only navigate if the path has actually changed in the store or if debouncedPath is not the current path
    const currentStorePath = useDriveStore.getState().path;
    if (debouncedPath && debouncedPath !== currentStorePath) {
       navigate(debouncedPath, { replace: true });
    }
  }, [debouncedPath, navigate]);

  const handleTabChange = (newContext: ViewContext) => {
    if (viewContext === newContext) return;

    navigate("/", {
      viewContext: newContext,
      shareToken: null,
      ownerId: null,
      replace: false,
    });
  };

  return (
    <div className="w-full bg-background/70 backdrop-blur border-b">
      {/* Top Row: Navigation & Path */}
      <div className="flex items-center gap-3 px-4 py-2">
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
            // Disable the path bar if we are in ANY virtual context
            disabled={viewContext !== "personal"}
            placeholder="/"
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setInputPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(inputPath, { replace: false });
            }}
            className="border-none shadow-none p-1 h-auto bg-transparent text-sm focus-visible:ring-0 disabled:opacity-50"
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

      {/* Bottom Row: Scalable Tabs */}
      <div className="flex items-center gap-2 px-6 mt-1 overflow-x-auto no-scrollbar">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = viewContext === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cx(
                "flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExplorerHeader;
