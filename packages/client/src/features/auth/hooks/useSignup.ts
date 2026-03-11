import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { signup } from '../api/signup';
import { useRouter } from 'next/navigation';
import { ServerError } from '@homelab/shared/types';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/auth';
import useAuthStore from '../stores/auth.store';

export type UseSignupOptions = {
  onFieldError: (errors: Record<string, string[]>) => void;
  onGlobalError: (msg: string) => void;
};

export function useSignup(options: UseSignupOptions) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation<
    responseSchemas.SignupResponse,
    AxiosError<ServerError>,
    requestSchemas.SignupInput
  >({
    mutationFn: signup,
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.tokens.access);
      router.push('/');
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
