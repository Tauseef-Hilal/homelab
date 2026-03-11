import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';
import { ServerError } from '@homelab/shared/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { moveItems } from '../api/moveItems';
import { toast } from 'sonner';

export type UseMoveItemsOptions = {
  onSuccess: (data: responseSchemas.MoveItemsOutput) => void;
  onError: (error: string) => void;
};

export function useMoveItems(options: UseMoveItemsOptions) {
  return useMutation<
    responseSchemas.MoveItemsOutput,
    AxiosError<ServerError>,
    requestSchemas.MoveItemsInput
  >({
    mutationFn: moveItems,
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
