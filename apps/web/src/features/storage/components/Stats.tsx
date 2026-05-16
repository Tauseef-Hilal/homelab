"use client";

import { formatSize } from "@client/lib/utils";
import { useGetStats } from "../hooks/useGetStats";
import { cx } from "class-variance-authority";

const StorageStats: React.FC = () => {
  const { data, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 bg-muted/20 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl animate-pulse">
        <div className="w-12 sm:w-16 h-2 bg-muted rounded-full" />
        <div className="hidden lg:block w-20 h-1.5 bg-muted rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const percent = Math.min((data.storageUsed / data.storageQuota) * 100, 100);

  const barColorClass =
    percent > 90
      ? "bg-destructive shadow-[0_0_8px_rgba(var(--destructive),0.5)]"
      : percent > 70
        ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"
        : "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]";

  return (
    <div
      className="group flex items-center gap-2 sm:gap-3 bg-muted/30 hover:bg-muted/50 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 border border-transparent hover:border-border/40"
      title={`${formatSize(data.storageUsed)} used of ${formatSize(
        data.storageQuota,
      )}`}
    >
      <div className="flex flex-col gap-0 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] sm:text-xs font-bold text-foreground/80 uppercase tracking-widest hidden sm:inline">
            Storage
          </span>
          <span className="text-xs sm:text-sm font-bold text-muted-foreground">
            {Math.round(percent)}%
          </span>
        </div>
        <span className="text-xs sm:text-sm font-bold text-muted-foreground/70 tracking-tight hidden sm:inline">
          {formatSize(data.storageUsed)}
        </span>
      </div>

      <div className="hidden lg:block w-20 h-1.5 bg-muted/60 rounded-full overflow-hidden shadow-inner">
        <div
          className={cx("h-full transition-all duration-1000 ease-out", barColorClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default StorageStats;
