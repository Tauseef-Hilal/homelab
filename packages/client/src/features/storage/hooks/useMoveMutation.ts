import { useQueryClient } from '@tanstack/react-query';
import { useMoveItems } from './useMoveItems';
import { toast } from 'sonner';
import { getJob } from '../api/getJob';

export function useMoveMutation(path: string) {
  const queryClient = useQueryClient();

  return useMoveItems({
    onSuccess: (data) => {
      const toastId = `toast-${data.job.id}`;
      toast.loading('Preparing files', { id: toastId });

      const interval = setInterval(async () => {
        try {
          const jobRes = await getJob(data.job.id);
          const status = jobRes.job.status;

          switch (status) {
            case 'completed':
              toast.success('Files moved successfully', { id: toastId });
              queryClient.invalidateQueries({
                queryKey: ['listDirectory', path],
              });
              queryClient.invalidateQueries({ queryKey: ['stats'] });
              clearInterval(interval);
              break;

            case 'processing':
              toast.loading(`Moving files: ${jobRes.job.progress}%`, {
                id: toastId,
              });
              break;

            case 'failed':
              toast.error('Some files failed to move', { id: toastId });
              clearInterval(interval);
              break;

            default:
              toast.loading('Move job enqueued', { id: toastId });
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
