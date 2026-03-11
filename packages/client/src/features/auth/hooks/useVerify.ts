import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { verify } from '../api/verify';
import { ServerError } from '@homelab/shared/types';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/auth';
import { useRouter } from 'next/navigation';
import useAuthStore from '../stores/auth.store';

export type UseVerifyOtpOptions = {
  onFieldError: (errors: Record<string, string[]>) => void;
  onGlobalError: (msg: string) => void;
};

export function useVerifyOtp(options: UseVerifyOtpOptions) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation<
    responseSchemas.VerifyOtpResponse,
    AxiosError<ServerError>,
    requestSchemas.VerifyOtpInput
  >({
    mutationFn: verify,
    onSuccess: (data) => {
      if (data.tokens) {
        setAccessToken(data.tokens.access);
        setUser(data.user!);
        router.push('/');
        return;
      }

      if (data.changePasswordToken) {
        router.push(`/auth/change-password?token=${data.changePasswordToken}`);
      }
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
