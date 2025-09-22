import { UploadFileResponse } from '@shared/schemas/storage/response/file.schema';
import { useMutation } from '@tanstack/react-query';
import { uploadFile } from '../api/uploadFile';
import { AxiosError } from 'axios';
import { ServerError } from '@shared/types/error';
import { UploadFileInput } from '@shared/schemas/storage/request/file.schema';

export type UseUploadFileOptions = {
  onSuccess: (data: UploadFileResponse) => void;
  onError: (error: string) => void;
};

export function useUploadFile(options: UseUploadFileOptions) {
  return useMutation<
    UploadFileResponse,
    AxiosError<ServerError>,
    UploadFileInput
  >({
    mutationFn: uploadFile,
    onSuccess: options.onSuccess,
    onError: (error) => {
      const serverError = error.response?.data;

      if (serverError) {
        options.onError(serverError.message);
      }

      alert(error)
    },
  });
}
