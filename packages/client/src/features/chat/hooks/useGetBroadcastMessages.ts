import { useQuery } from '@tanstack/react-query';
import { getBroadcastMessages } from '../api/getBroadcastMessages';

export function useGetBroadcastMessages(
  limit?: number,
  offsetSentAt?: string,
  offsetId?: string
) {
  return useQuery({
    queryKey: ['broadcast-messages', limit, offsetSentAt, offsetId],
    queryFn: () => getBroadcastMessages({ limit, offsetSentAt, offsetId }),
  });
}
