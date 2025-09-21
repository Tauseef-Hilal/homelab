import { useMutation } from '@tanstack/react-query';
import { listDirectory } from '../api/listDirectory';
import { AxiosError } from 'axios';
import { ServerError } from '@shared/types/error';
import { ListDirectoryInput } from '@shared/schemas/storage/request/folder.schema';
import { ListDirectoryResponse } from '@shared/schemas/storage/response/folder.schema';

export type UseListDirectoryOptions = {
  onError: (err: string) => void;
  onSuccess: (data: ListDirectoryResponse) => void;
};

export function useListDirectory(options: UseListDirectoryOptions) {
  return useMutation<
    ListDirectoryResponse,
    AxiosError<ServerError>,
    ListDirectoryInput
  >({
    mutationFn: (data: ListDirectoryInput) => listDirectory(data.path),
    onSuccess: (data) => options.onSuccess(data),
    onError: (error) => {
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
      }
    },
  });
}
