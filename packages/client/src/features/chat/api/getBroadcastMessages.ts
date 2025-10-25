import api from '@client/lib/api';
import { GetBroadcastMessagesInput } from '@shared/schemas/chat/request.schema';
import { getBroadcastMessagesSchema } from '@shared/schemas/chat/response.schema';

export async function getBroadcastMessages({
  cursorId,
  cursorSentAt,
  limit,
}: GetBroadcastMessagesInput) {
  const params = new URLSearchParams();

  if (limit) params.set('limit', String(limit));
  if (cursorId && cursorSentAt) {
    params.set('cursorId', String(cursorId));
    params.set('cursorSentAt', String(cursorSentAt));
  }

  const url = `/chat/broadcast${params.toString() ? `?${params}` : ''}`;
  const res = await api(url);

  return getBroadcastMessagesSchema.parse(res.data);
}
