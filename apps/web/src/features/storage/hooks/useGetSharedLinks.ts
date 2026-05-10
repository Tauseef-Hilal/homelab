import { responseSchemas } from '@homelab/contracts/schemas/sharing';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/contracts/types';
import { fetchSharedLinks } from '../api/fetchSharedLinks';
import useAuthStore from '@client/stores/auth.store';

export function useGetSharedLinks(itemId: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery<
    responseSchemas.GetSharedLinksOutput,
    AxiosError<ServerError>
  >({
    queryKey: ['linkShares', itemId],
    queryFn: ({ signal }) => fetchSharedLinks(itemId, signal),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
