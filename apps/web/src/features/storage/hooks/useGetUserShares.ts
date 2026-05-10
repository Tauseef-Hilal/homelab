import { responseSchemas } from '@homelab/contracts/schemas/sharing';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/contracts/types';
import { fetchUserShares } from '../api/fetchUserShares';
import useAuthStore from '@client/stores/auth.store';

export function useGetUserShares(itemId: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery<responseSchemas.GetUserSharesOutput, AxiosError<ServerError>>(
    {
      queryKey: ['userShares', itemId],
      queryFn: ({ signal }) => fetchUserShares(itemId, signal),
      enabled: !!user,
      staleTime: 1 * 60 * 1000,
    },
  );
}
