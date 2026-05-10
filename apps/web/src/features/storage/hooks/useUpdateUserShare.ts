import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { ServerError } from '@homelab/contracts/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { updateUserShare } from '../api/updateUserShare';

export type UseUpdateUserShareOptions = {
  onSuccess: () => void;
  onError: (error: string) => void;
};

export function useUpdateUserShare(options: UseUpdateUserShareOptions) {
  return useMutation<
    void,
    AxiosError<ServerError>,
    requestSchemas.UpdateUserShareInput & { itemId: string }
  >({
    mutationFn: (data) => updateUserShare(data),
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
