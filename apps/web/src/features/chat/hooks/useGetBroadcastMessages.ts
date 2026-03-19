import { useInfiniteQuery } from '@tanstack/react-query';
import { getBroadcastMessages } from '../api/getBroadcastMessages';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/contracts/types';
import { responseSchemas } from '@homelab/contracts/schemas/chat';

export function useGetBroadcastMessages(limit?: number) {
  return useInfiniteQuery<
    responseSchemas.GetBroadcastMessagesOutput,
    AxiosError<ServerError>
  >({
    queryKey: ['broadcast-messages'],
    queryFn: ({ pageParam }) => {
      return getBroadcastMessages({
        cursorId: (
          pageParam as responseSchemas.GetBroadcastMessagesOutput['nextCursor']
        )?.id,
        cursorSentAt: (
          pageParam as responseSchemas.GetBroadcastMessagesOutput['nextCursor']
        )?.sentAt,
        limit,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor ?? undefined;
    },
    initialPageParam: undefined,
  });
}
