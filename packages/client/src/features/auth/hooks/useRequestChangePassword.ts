import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { requestChangePassword } from '../api/requestChangePassword';
import { ServerError } from '@homelab/shared/types';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/auth';

export interface UseRequestChangePasswordOptions {
  onGlobalError: (err: string) => void;
}

export function useRequestChangePassword(
  options: UseRequestChangePasswordOptions
) {
  const router = useRouter();

  return useMutation<
    responseSchemas.RequestChangePasswordResponse,
    AxiosError<ServerError>,
    requestSchemas.RequestChangePasswordInput
  >({
    mutationFn: requestChangePassword,
    onSuccess: (data) => {
      router.push(`/auth/verification?token=${data.token}`);
    },
    onError: (error) => {
      const serverError = error.response?.data;

      if (serverError) {
        options.onGlobalError(serverError.message);
      }
    },
  });
}
