import { useMutation } from '@tanstack/react-query';
import { createFolder } from '../api/createFolder';
import { CreateFolderResponse } from '@shared/schemas/storage/response.schema';
import { AxiosError } from 'axios';
import { ServerError } from '@shared/types/error';
import { CreateFolderInput } from '@shared/schemas/storage/request.schema';

export type UseCreateFolderOptions = {
  onSuccess: (data: CreateFolderResponse) => void;
  onError: (err: string) => void;
};

export function useCreateFolder(options: UseCreateFolderOptions) {
  return useMutation<
    CreateFolderResponse,
    AxiosError<ServerError>,
    CreateFolderInput
  >({
    mutationFn: createFolder,
    onSuccess: (data) => options.onSuccess(data),
    onError: (error) => {
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
      }

      alert(error);
    },
  });
}
