import { MoveItemsOutput } from '@shared/schemas/storage/response.schema';
import { MoveItemsInput } from '@shared/schemas/storage/request.schema';
import { ServerError } from '@shared/types/error';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { moveItems } from '../api/moveItems';
import { toast } from 'sonner';

export type UseMoveItemsOptions = {
  onSuccess: (data: MoveItemsOutput) => void;
  onError: (error: string) => void;
};

export function useMoveItems(options: UseMoveItemsOptions) {
  return useMutation<MoveItemsOutput, AxiosError<ServerError>, MoveItemsInput>({
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
