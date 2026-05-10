import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { ServerError } from '@homelab/contracts/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { revokeUserShare } from '../api/revokeUserShare';
import { toast } from 'sonner';

export type UseRevokeUserShareOptions = {
  onSuccess: () => void;
  onError: (error: string) => void;
};

export function useRevokeUserShare(options: UseRevokeUserShareOptions) {
  return useMutation<
    void,
    AxiosError<ServerError>,
    requestSchemas.RevokeUserShareInput & { itemId: string }
  >({
    mutationFn: (data) => revokeUserShare(data),
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
