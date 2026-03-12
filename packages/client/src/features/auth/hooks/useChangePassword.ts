import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { changePassword } from '../api/changePassword';
import { ServerError } from '@homelab/shared/types';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/auth';

export type UseChangePasswordOptions = {
  onFieldError: (errors: Record<string, string[]>) => void;
  onGlobalError: (error: string) => void;
};

export function useChangePassword(options: UseChangePasswordOptions) {
  const router = useRouter();

  return useMutation<
    responseSchemas.ChangePasswordResponse,
    AxiosError<ServerError>,
    requestSchemas.ChangePasswordInput
  >({
    mutationFn: changePassword,
    onSuccess: () => {
      router.replace('/auth/login');
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
