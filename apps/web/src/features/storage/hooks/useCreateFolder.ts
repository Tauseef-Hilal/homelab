import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFolder } from '../api/createFolder';
import { ServerError } from '@homelab/contracts/types';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';
import useDriveStore from '../stores/drive.store';

export type UseCreateFolderOptions = {
  onSuccess: (data: responseSchemas.CreateFolderResponse) => void;
  onError: (err: string) => void;
};

export function useCreateFolder(options: UseCreateFolderOptions) {
  const path = useDriveStore((s) => s.path);
  const viewContext = useDriveStore((s) => s.viewContext);
  const queryClient = useQueryClient();

  return useMutation<
    responseSchemas.CreateFolderResponse,
    AxiosError<ServerError>,
    requestSchemas.CreateFolderInput
  >({
    mutationFn: createFolder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drive', viewContext, path] });
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
