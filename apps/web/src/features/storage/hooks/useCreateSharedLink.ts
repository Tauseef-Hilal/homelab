import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { ServerError } from '@homelab/contracts/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { createSharedLink } from '../api/createSharedLink';

export type UseCreateSharedLinkOptions = {
  onSuccess: () => void;
  onError: (error: string) => void;
};

export function useCreateSharedLink(options: UseCreateSharedLinkOptions) {
  return useMutation<
    void,
    AxiosError<ServerError>,
    requestSchemas.ShareLinkInput & { itemId: string }
  >({
    mutationFn: (data) => createSharedLink(data),
    onSuccess: options.onSuccess,
    onError: (error) => {
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
        return;
      }

      toast.error(error.message);
    },
  });
}
