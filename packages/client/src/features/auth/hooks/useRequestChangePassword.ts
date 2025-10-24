import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { requestChangePassword } from '../api/requestChangePassword';
import { RequestChangePasswordResponse } from '@shared/schemas/auth/response/auth.schema';
import { ServerError } from '@shared/types/error';
import { AxiosError } from 'axios';
import { RequestChangePasswordInput } from '@shared/schemas/auth/request/auth.schema';

export interface UseRequestChangePasswordOptions {
  onGlobalError: (err: string) => void;
}

export function useRequestChangePassword(
  options: UseRequestChangePasswordOptions
) {
  const router = useRouter();

  return useMutation<
    RequestChangePasswordResponse,
    AxiosError<ServerError>,
    RequestChangePasswordInput
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
