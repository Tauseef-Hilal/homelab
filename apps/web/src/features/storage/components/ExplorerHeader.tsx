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
  // ... navigation and state (unchanged)
  const inputPath = useDriveStore((s) => s.inputPath);
  const setInputPath = useDriveStore((s) => s.setInputPath);
  const navigate = useDriveStore((s) => s.navigate);
  const goBack = useDriveStore((s) => s.goBack);
  const goForward = useDriveStore((s) => s.goForward);
  const viewMode = useDriveStore((s) => s.viewMode);
  const setViewMode = useDriveStore((s) => s.setViewMode);
  const viewContext = useDriveStore((s) => s.viewContext);
  const canGoBack = useDriveStore((s) => s.historyIndex > 0);
  const canGoForward = useDriveStore(
    (s) => s.historyIndex < s.history.length - 1,
  );
  const debouncedPath = useDebouncedValue(inputPath, 500);

  useEffect(() => {
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
    <div className="w-full glass border-b border-border/40 overflow-hidden">
      {/* Top Row: Navigation & Path */}
      <div className="flex items-center gap-2 md:gap-4 px-4 py-3">
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl">
          <Button
            variant="ghost"
            size="icon"
            disabled={!canGoBack}
            className="h-9 w-9 rounded-lg hover:bg-background/80 disabled:opacity-30 transition-all"
            onClick={goBack}
          >
            <ArrowLeft size={18} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            disabled={!canGoForward}
            className="h-9 w-9 rounded-lg hover:bg-background/80 disabled:opacity-30 transition-all"
            onClick={goForward}
          >
            <ArrowRight size={18} />
          </Button>
        </div>

        {/* Path bar */}
        <div
          className={cx(
            "flex items-center gap-2 flex-1",
            "rounded-xl px-4 py-2",
            "bg-muted/50 border border-transparent",
            "transition-all duration-300",
            "focus-within:bg-background focus-within:border-primary/20 focus-within:shadow-lg focus-within:shadow-primary/5",
          )}
        >
          <FolderIcon size={16} className="text-primary/60 shrink-0" />

          <Input
            type="text"
            value={inputPath}
            disabled={viewContext !== "personal"}
            placeholder="Search or enter path..."
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setInputPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(inputPath, { replace: false });
            }}
            className="border-none shadow-none p-0 h-auto bg-transparent text-sm font-medium focus-visible:ring-0 disabled:opacity-50 placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className={cx(
              "h-9 w-9 rounded-lg transition-all",
              viewMode === "grid" ? "bg-background shadow-sm text-primary" : "hover:bg-background/80"
            )}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid size={18} />
          </Button>

          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className={cx(
              "h-9 w-9 rounded-lg transition-all",
              viewMode === "list" ? "bg-background shadow-sm text-primary" : "hover:bg-background/80"
            )}
            onClick={() => setViewMode("list")}
          >
            <List size={18} />
          </Button>
        </div>
      </div>

      {/* Bottom Row: Tabs */}
      <div className="flex items-center gap-2 px-6 overflow-x-auto no-scrollbar border-t border-border/10 bg-muted/10">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = viewContext === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cx(
                "relative flex items-center gap-2 px-4 py-4 text-xs md:text-sm font-bold transition-all whitespace-nowrap uppercase tracking-widest",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={16} className={cx("transition-transform duration-300", isActive && "scale-110")} />
              {tab.label}
              
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(var(--primary),0.5)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExplorerHeader;
