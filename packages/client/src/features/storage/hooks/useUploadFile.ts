import { useMutation } from '@tanstack/react-query';
import { uploadFile } from '../api/uploadFile';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/shared/types';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';

export type UseUploadFileOptions = {
  onSuccess: (data: responseSchemas.UploadFileResponse) => void;
  onError: (file: File) => void;
};

export function useUploadFile(options: UseUploadFileOptions) {
  return useMutation<
    responseSchemas.UploadFileResponse,
    AxiosError<ServerError>,
    requestSchemas.UploadFileInput
  >({
    mutationFn: uploadFile,
    onSuccess: options.onSuccess,
    onError: (error) => {
      const body = error.config?.data;
      options.onError(body.file);
    },
  });
}
