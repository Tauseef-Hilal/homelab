import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/login';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/auth';
import { ServerError } from '@homelab/shared/types';
import { useRouter } from 'next/navigation';

export type UseLoginOptions = {
  onFieldError: (errors: Record<string, string[]>) => void;
  onGlobalError: (msg: string) => void;
};

export function useLogin(options: UseLoginOptions) {
  const router = useRouter();

  return useMutation<
    responseSchemas.LoginResponse,
    AxiosError<ServerError>,
    requestSchemas.LoginInput
  >({
    mutationFn: login,
    onSuccess: (data) => {
      router.push(`/auth/verification?token=${data.token}`);
    },
    onError: (error) => {
      const serverError = error.response?.data;
      const fieldErrors = serverError?.details?.fieldErrors;

      if (fieldErrors) {
        options.onFieldError(fieldErrors);
      }

      if (serverError) {
        options.onGlobalError(serverError.message);
      }
    },
  });
}
