"use client";

import { useGetStats } from "../hooks/useGetStats";

const formatSize = (bytes: number) => {
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
};

const StorageStats: React.FC = () => {
  const { data, isLoading } = useGetStats();

  if (isLoading || !data) return null;

  const percent = Math.min((data.storageUsed / data.storageQuota) * 100, 100);

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
      {/* Storage text */}
      <span>
        {formatSize(data.storageUsed)}
        {" / " + formatSize(data.storageQuota)}
      </span>

      {/* Progress bar (hidden on small screens) */}
      <div className="hidden sm:block w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default StorageStats;
