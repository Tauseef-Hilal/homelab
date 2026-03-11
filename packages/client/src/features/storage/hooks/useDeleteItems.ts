import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';
import { ServerError } from '@homelab/shared/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { deleteItems } from '../api/deleteItems';
import { toast } from 'sonner';

export type UseDeleteItemsOptions = {
  onSuccess: (data: responseSchemas.DeleteItemsOutput) => void;
  onError: (error: string) => void;
};

export function useDeleteItems(options: UseDeleteItemsOptions) {
  return useMutation<
    responseSchemas.DeleteItemsOutput,
    AxiosError<ServerError>,
    requestSchemas.DeleteItemsInput
  >({
    mutationFn: deleteItems,
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
