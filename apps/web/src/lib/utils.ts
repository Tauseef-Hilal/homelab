import { getJob } from '@client/features/storage/api/getJob';
import { File, Folder } from '@client/features/storage/types/storage.types';
import { GetJobOutput } from '@homelab/contracts/schemas/jobs/response.schema';
import { QueryClient } from '@tanstack/react-query';
import { clsx, type ClassValue } from 'clsx';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isFolder(item: File | Folder): item is Folder {
  return (item as Folder).parentId !== undefined;
}

export function stringToHslColor(str: string, s = 70, l = 40): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360; // hue from 0–359
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function formatSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = bytes;

  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }

  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function pollJobData(
  jobId: string,
  messages?: Record<'processing' | 'completed' | 'failed', string>,
  onComplete?: (data: GetJobOutput['result']) => void,
  onError?: (err: string) => void,
) {
  const toastId = `toast-${jobId}`;
  toast.loading('Preparing files', { id: toastId });

  const interval = setInterval(async () => {
    try {
      const job = await getJob(jobId);

      switch (job.status) {
        case 'completed':
          toast.success(messages?.completed ?? 'Operation successful', {
            id: toastId,
          });
          onComplete?.call(null, job.result);
          clearInterval(interval);
          break;

        case 'processing':
          toast.loading(
            `${messages?.processing ?? 'Processing files:'} ${job.progress}%`,
            {
              id: toastId,
            },
          );
          break;

        case 'failed':
          toast.error(
            job.error ?? messages?.failed ?? 'Operation failed to complete',
            {
              id: toastId,
            },
          );
          onError?.call(null, job.error ?? '');
          clearInterval(interval);
          break;

        default:
          break;
      }
    } catch {
      toast.error('Failed to fetch job status', { id: toastId });
      clearInterval(interval);
    }
  }, 1000);
}

export function invalidateQueries(
  queryClient: QueryClient,
  queryKeys: string[][],
) {
  queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
}
