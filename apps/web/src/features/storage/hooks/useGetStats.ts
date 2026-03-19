import { responseSchemas } from '@homelab/contracts/schemas/storage';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '../api/getStats';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/contracts/types';
import useAuthStore from '@client/stores/auth.store';

export function useGetStats() {
  const user = useAuthStore((s) => s.user);

  return useQuery<responseSchemas.GetStatsOutput, AxiosError<ServerError>>({
    queryKey: ['stats'],
    queryFn: () => getStats(),
    enabled: !!user,
    staleTime: Infinity,
  });
}
