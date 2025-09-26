import { useMutation } from '@tanstack/react-query';
import { moveFile } from '../api/moveFile';
import { AxiosError } from 'axios';
import { ServerError } from '@shared/types/error';
import { MoveFileInput } from '@shared/schemas/storage/request/file.schema';

export type UseMoveFileOptions = {
  onSuccess: () => void;
  onError: (error: string) => void;
};

export function useMoveFile(fileId: string, options: UseMoveFileOptions) {
  return useMutation<void, AxiosError<ServerError>, MoveFileInput>({
    mutationFn: (data) => moveFile(fileId, data),
    onSuccess: options.onSuccess,
    onError: (error) => {
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
      } else {
        options.onError('Unknown error occured');
      }
    },
  });
}
