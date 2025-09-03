import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { SignupResponse } from '@shared/schemas/auth/response/auth.schema';
import { ServerError } from '@shared/types/error';
import { SignupInput } from '@shared/schemas/auth/request/auth.schema';
import useAuthStore from '../stores/auth.store';
import { signup } from '../api/signup';
import { useRouter } from 'next/navigation';

export type UseSignupOptions = {
  onFieldError: (errors: Record<string, string[]>) => void;
  onGlobalError: (msg: string) => void;
};

export function useSignup(options: UseSignupOptions) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation<SignupResponse, AxiosError<ServerError>, SignupInput>({
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
