import { GetStatsOutput } from '@shared/schemas/storage/response.schema';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '../api/getStats';
import { AxiosError } from 'axios';
import { ServerError } from '@shared/types/error';

export function useGetStats() {
  return useQuery<GetStatsOutput, AxiosError<ServerError>>({
    queryKey: ['stats'],
    queryFn: () => getStats(),
  });
}
