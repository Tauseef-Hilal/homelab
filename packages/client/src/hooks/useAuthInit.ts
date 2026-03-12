import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { refresh } from '@client/api/refresh';
import useAuthStore from '@client/stores/auth.store';

export function useAuthInit() {
  const queryClient = useQueryClient();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setAuthInitialized = useAuthStore((s) => s.setAuthInitialized);
  const router = useRouter();

  return useMutation({
    mutationKey: ['auth-init'],
    mutationFn: refresh,
    retry: 1,
    onSuccess: (data) => {
      setAccessToken(data.tokens.access);
      setAuthInitialized(true);
    },
    onError: () => {
      setAuthInitialized(true);
      queryClient.clear();
      router.replace('/auth/login');
    },
  });
}
