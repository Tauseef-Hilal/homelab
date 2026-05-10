import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { ServerError } from '@homelab/contracts/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { revokeSharedLink } from '../api/revokeSharedLink';

export type UseRevokeSharedLinkOptions = {
  onSuccess: () => void;
  onError: (error: string) => void;
};

export function useRevokeSharedLink(options: UseRevokeSharedLinkOptions) {
  return useMutation<
    void,
    AxiosError<ServerError>,
    requestSchemas.RevokeSharedLinkInput
  >({
    mutationFn: (data) => revokeSharedLink(data),
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
