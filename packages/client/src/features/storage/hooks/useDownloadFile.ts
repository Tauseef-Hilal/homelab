import { useMutation } from '@tanstack/react-query';
import { downloadFile } from '../api/downloadFile';
import { AxiosError } from 'axios';
import { ServerError } from '@shared/types/error';

export type UseDownloadFileOptions = {
  onSuccess: (data: Blob) => void;
  onError: (err: string) => void;
};

export function useDownloadFile(options: UseDownloadFileOptions) {
  return useMutation<Blob, AxiosError<ServerError>, string>({
    mutationFn: downloadFile,
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
