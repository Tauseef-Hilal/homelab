import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../stores/auth.store';
import { logout } from '../api/logout';
import { useRouter } from 'next/navigation';
import { LogoutResponse } from '@shared/schemas/auth/response/auth.schema';
import { AxiosError } from 'axios';
import { ServerError } from '@shared/types/error';
import { LogoutInput } from '@shared/schemas/auth/request/auth.schema';

export type UseLogoutOptions = {
  onError: (msg: string) => void;
};

export function useLogout(options: UseLogoutOptions) {
  const queryClient = useQueryClient();
  const clearAuthState = useAuthStore((state) => state.logout);
  const router = useRouter();

  return useMutation<LogoutResponse, AxiosError<ServerError>, LogoutInput>({
    mutationFn: logout,
    onSuccess: () => {
      clearAuthState();
      queryClient.removeQueries({ queryKey: ['me'] });
      router.refresh();
    },
    onError: (error) => {
      alert(error.code);
      const serverError = error.response?.data;
      if (serverError) {
        options.onError(serverError.message);
      }
    },
  });
}
