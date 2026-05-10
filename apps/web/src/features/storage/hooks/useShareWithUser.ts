import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { ServerError } from '@homelab/contracts/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { shareWithUser } from '../api/shareWithUser';

export type UseShareWithUserOptions = {
  onSuccess: () => void;
  onError: (error: string) => void;
};

export function useShareWithUser(options: UseShareWithUserOptions) {
  return useMutation<
    void,
    AxiosError<ServerError>,
    requestSchemas.ShareWithUserInput & { itemId: string }
  >({
    mutationFn: (data) => shareWithUser(data),
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
