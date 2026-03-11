import { responseSchemas } from '@homelab/shared/schemas/storage';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '../api/getStats';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/shared/types';

export function useGetStats() {
  return useQuery<responseSchemas.GetStatsOutput, AxiosError<ServerError>>({
    queryKey: ['stats'],
    queryFn: () => getStats(),
  });
}
