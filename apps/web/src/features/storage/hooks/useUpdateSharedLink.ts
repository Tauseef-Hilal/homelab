import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { ServerError } from '@homelab/contracts/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { updateSharedLink } from '../api/updateSharedLink';

export type UseUpdateSharedLinkOptions = {
  onSuccess: () => void;
  onError: (error: string) => void;
};

export function useUpdateSharedLink(options: UseUpdateSharedLinkOptions) {
  return useMutation<
    void,
    AxiosError<ServerError>,
    requestSchemas.UpdateLinkInput & { token: string }
  >({
    mutationFn: (data) => updateSharedLink(data),
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
