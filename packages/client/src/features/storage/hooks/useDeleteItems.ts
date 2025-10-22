import { DeleteItemsOutput } from '@shared/schemas/storage/response.schema';
import { DeleteItemsInput } from '@shared/schemas/storage/request.schema';
import { ServerError } from '@shared/types/error';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { deleteItems } from '../api/deleteItems';
import { toast } from 'sonner';

export type UseDeleteItemsOptions = {
  onSuccess: (data: DeleteItemsOutput) => void;
  onError: (error: string) => void;
};

export function useDeleteItems(options: UseDeleteItemsOptions) {
  return useMutation<DeleteItemsOutput, AxiosError<ServerError>, DeleteItemsInput>({
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
