import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFolder } from '../api/createFolder';
import { ServerError } from '@homelab/contracts/types';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';

export type UseCreateFolderOptions = {
  onSuccess: (data: responseSchemas.CreateFolderResponse) => void;
  onError: (err: string) => void;
};

export function useCreateFolder(options: UseCreateFolderOptions) {
  const queryClient = useQueryClient();

  return useMutation<
    responseSchemas.CreateFolderResponse,
    AxiosError<ServerError>,
    requestSchemas.CreateFolderInput
  >({
    mutationFn: createFolder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['paths'] });
      options.onSuccess(data);
    },
    onError: (error) => {
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
      }

      alert(error);
    },
  });
}
