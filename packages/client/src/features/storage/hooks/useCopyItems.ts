import { CopyItemsOutput } from '@shared/schemas/storage/response/schema';
import { CopyItemsInput } from '@shared/schemas/storage/request/schema';
import { ServerError } from '@shared/types/error';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { copyItems } from '../api/copyItems';

export type UseCopyItemsOptions = {
  onSuccess: (data: CopyItemsOutput) => void;
  onError: (error: string) => void;
};

export function useCopyItems(options: UseCopyItemsOptions) {
  return useMutation<CopyItemsOutput, AxiosError<ServerError>, CopyItemsInput>({
    mutationFn: copyItems,
    onSuccess: options.onSuccess,
    onError: (error) => {
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
      }

      alert(error);
    },
  });
}
