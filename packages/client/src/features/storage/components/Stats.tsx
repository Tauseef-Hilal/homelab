"use client";

import { formatSize } from "@client/lib/utils";
import { useGetStats } from "../hooks/useGetStats";
import { cx } from "class-variance-authority";

const StorageStats: React.FC = () => {
  const { data, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Loading...</span>
        <div className="w-24 h-1.5 bg-muted rounded-full animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const percent = Math.min((data.storageUsed / data.storageQuota) * 100, 100);

  const barColor =
    percent > 90
      ? "bg-red-500"
      : percent > 70
        ? "bg-yellow-500"
        : "bg-blue-500";

  return (
    <div
      className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap"
      title={`${formatSize(data.storageUsed)} used of ${formatSize(
        data.storageQuota,
      )}`}
    >
      <span className="font-medium">
        {formatSize(data.storageUsed)} / {formatSize(data.storageQuota)}
      </span>

      <div className="hidden sm:block w-24 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cx("h-full transition-all duration-500", barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default StorageStats;
