import { useQuery } from '@tanstack/react-query';
import { listDirectory } from '../api/listDirectory';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/shared/types';
import { responseSchemas } from '@homelab/shared/schemas/storage';
import useAuthStore from '@client/stores/auth.store';

export function useListDirectory(path: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery<
    responseSchemas.ListDirectoryResponse,
    AxiosError<ServerError>
  >({
    queryKey: ['list', path],
    queryFn: ({ signal }) => listDirectory(path, signal),
    enabled: !!user,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: AxiosError) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });
}
