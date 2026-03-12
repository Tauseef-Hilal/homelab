import { toast } from 'sonner';
import { getJob } from '../api/getJob';
import { useDeleteItems } from './useDeleteItems';
import { useQueryClient } from '@tanstack/react-query';

export function useDeleteMutation(path: string) {
  const queryClient = useQueryClient();

  return useDeleteItems({
    onSuccess: (data) => {
      const toastId = `toast-${data.job.id}`;
      toast.loading('Delete job enqueued', { id: toastId });

      const interval = setInterval(async () => {
        try {
          const jobRes = await getJob(data.job.id);
          const status = jobRes.job.status;

          switch (status) {
            case 'completed':
              toast.success('Files deleted successfully', { id: toastId });
              queryClient.invalidateQueries({ queryKey: ['stats'] });
              queryClient.invalidateQueries({
                queryKey: ['listDirectory', path],
              });
              clearInterval(interval);
              break;

            case 'processing':
              toast.loading(`Deleting files: ${jobRes.job.progress}%`, {
                id: toastId,
              });
              break;

            case 'failed':
              toast.error('Some files failed to delete', { id: toastId });
              clearInterval(interval);
              break;

            default:
              toast.loading('Delete job enqueued', { id: toastId });
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
