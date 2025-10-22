import { DownloadItemsOutput } from '@shared/schemas/storage/response.schema';
import { DownloadItemsInput } from '@shared/schemas/storage/request.schema';
import { ServerError } from '@shared/types/error';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { downloadItems } from '../api/downloadItems';
import { toast } from 'sonner';

export type UseDownloadItemsOptions = {
  onSuccess: (data: DownloadItemsOutput) => void;
  onError: (error: string) => void;
};

export function useDownloadItems(options: UseDownloadItemsOptions) {
  return useMutation<DownloadItemsOutput, AxiosError<ServerError>, DownloadItemsInput>({
    mutationFn: downloadItems,
    onSuccess: options.onSuccess,
    onError: (error) => {
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
      }

      toast.error(error.message);
    },
  });
}
