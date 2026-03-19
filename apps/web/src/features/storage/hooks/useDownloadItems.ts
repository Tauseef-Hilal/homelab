import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';
import { ServerError } from '@homelab/contracts/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { downloadItems } from '../api/downloadItems';
import { toast } from 'sonner';

export type UseDownloadItemsOptions = {
  onSuccess: (data: responseSchemas.DownloadItemsOutput) => void;
  onError: (error: string) => void;
};

export function useDownloadItems(options: UseDownloadItemsOptions) {
  return useMutation<
    responseSchemas.DownloadItemsOutput,
    AxiosError<ServerError>,
    requestSchemas.DownloadItemsInput
  >({
    mutationFn: downloadItems,
    onSuccess: options.onSuccess,
    onError: (error) => {
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
        return;
      }

      toast.error(error.message);
    },
  });
}
