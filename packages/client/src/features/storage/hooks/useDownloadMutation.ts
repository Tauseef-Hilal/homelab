import { toast } from 'sonner';
import { useDownloadItems } from './useDownloadItems';
import { getJob } from '../api/getJob';

export function useDownloadMutation(onComplete: (link: string) => void) {
  return useDownloadItems({
    onSuccess: (data) => {
      const toastId = `toast-${data.job.id}`;
      toast.loading('Zipping items for download', { id: toastId });

      const interval = setInterval(async () => {
        try {
          const jobRes = await getJob(data.job.id);
          const status = jobRes.job.status;
          const result = jobRes.job.result;

          switch (status) {
            case 'completed':
              toast.success('Starting download', { id: toastId });
              clearInterval(interval);

              if (result) {
                onComplete((result as { downloadLink: string }).downloadLink);
              }
              break;

            case 'processing':
              toast.loading(`Zipping items: ${jobRes.job.progress}%`, {
                id: toastId,
              });
              break;

            case 'failed':
              toast.error('Failed to create zip', { id: toastId });
              clearInterval(interval);
              break;

            default:
              toast.loading('Download job enqueued', { id: toastId });
              break;
          }
        } catch {
          toast.error('Failed to fetch job status', { id: toastId });
          clearInterval(interval);
        }
      }, 1000);
    },
    onError: (err) => toast.error(err),
  });
}
