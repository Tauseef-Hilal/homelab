import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verify } from '../api/verify';
import { ServerError } from '@homelab/shared/types';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/auth';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../../stores/auth.store';

export type UseVerifyOtpOptions = {
  onFieldError: (errors: Record<string, string[]>) => void;
  onGlobalError: (msg: string) => void;
};

export function useVerifyOtp(options: UseVerifyOtpOptions) {
  const queryClient = useQueryClient();
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

        queryClient.invalidateQueries({ queryKey: ['me'] });

        router.push('/');
        return;
      }

      if (data.changePasswordToken) {
        router.push(
          `/auth/change-password?token=${encodeURIComponent(data.changePasswordToken)}`,
        );
      }
    },
    onError: (error) => {
      const serverError = error.response?.data;

      if (!serverError) {
        options.onGlobalError('Something went wrong');
        return;
      }

      const fieldErrors = serverError.details?.fieldErrors;

      if (fieldErrors) {
        options.onFieldError(fieldErrors);
        return;
      }

      options.onGlobalError(serverError.message);
    },
  });
}
