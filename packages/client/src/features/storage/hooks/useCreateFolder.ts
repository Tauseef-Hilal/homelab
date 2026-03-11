import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { createFolder } from '../api/createFolder';
import { ServerError } from '@homelab/shared/types';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';

export type UseCreateFolderOptions = {
  onSuccess: (data: responseSchemas.CreateFolderResponse) => void;
  onError: (err: string) => void;
};

export function useCreateFolder(options: UseCreateFolderOptions) {
  return useMutation<
    responseSchemas.CreateFolderResponse,
    AxiosError<ServerError>,
    requestSchemas.CreateFolderInput
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
