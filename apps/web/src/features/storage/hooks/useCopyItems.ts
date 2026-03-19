import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';
import { ServerError } from '@homelab/contracts/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { copyItems } from '../api/copyItems';
import { toast } from 'sonner';

export type UseCopyItemsOptions = {
  onSuccess: (data: responseSchemas.CopyItemsOutput) => void;
  onError: (error: string) => void;
};

export function useCopyItems(options: UseCopyItemsOptions) {
  return useMutation<
    responseSchemas.CopyItemsOutput,
    AxiosError<ServerError>,
    requestSchemas.CopyItemsInput
  >({
    mutationFn: copyItems,
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
