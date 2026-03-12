import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../../stores/auth.store';
import { logout } from '../api/logout';
import { useRouter } from 'next/navigation';
import { ServerError } from '@homelab/shared/types';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/auth';

export type UseLogoutOptions = {
  onError: (msg: string) => void;
};

export function useLogout(options: UseLogoutOptions) {
  const queryClient = useQueryClient();
  const clearAuthState = useAuthStore((state) => state.logout);
  const router = useRouter();

  return useMutation<
    responseSchemas.LogoutResponse,
    AxiosError<ServerError>,
    requestSchemas.LogoutInput
  >({
    mutationFn: logout,
    onSuccess: () => {
      clearAuthState();
      queryClient.clear();
      router.replace('/auth/login');
    },
    onError: (error) => {
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
      }
    },
  });
}
