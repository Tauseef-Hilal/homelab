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
      router.push('/auth/login');
    },
    onError: (err) => {
      console.dir(err.response?.data)
      const serverError = err.response?.data;
      const fieldErrors = serverError?.details?.fieldErrors;

      if (fieldErrors) {
        return options.onFieldError(fieldErrors);
      }

      if (serverError) {
        return options.onGlobalError(serverError.message);
      }
    },
  });
}
