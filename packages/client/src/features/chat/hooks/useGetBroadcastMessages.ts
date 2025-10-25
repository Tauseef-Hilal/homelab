import { useInfiniteQuery } from '@tanstack/react-query';
import { getBroadcastMessages } from '../api/getBroadcastMessages';
import { GetBroadcastMessagesOutput } from '@shared/schemas/chat/response.schema';
import { AxiosError } from 'axios';
import { ServerError } from '@shared/types/error';

export function useGetBroadcastMessages(limit?: number) {
  return useInfiniteQuery<GetBroadcastMessagesOutput, AxiosError<ServerError>>({
    queryKey: ['broadcast-messages'],
    queryFn: ({ pageParam }) => {
      return getBroadcastMessages({
        cursorId: (pageParam as GetBroadcastMessagesOutput['nextCursor'])?.id,
        cursorSentAt: (pageParam as GetBroadcastMessagesOutput['nextCursor'])
          ?.sentAt,
        limit,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor ?? undefined;
    },
    initialPageParam: undefined,
  });
}
