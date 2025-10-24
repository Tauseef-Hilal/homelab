import api from '@client/lib/api';
import { GetBroadcastMessagesInput } from '@shared/schemas/chat/request.schema';
import { getBroadcastMessagesSchema } from '@shared/schemas/chat/response.schema';

export async function getBroadcastMessages({
  limit,
  offsetSentAt,
  offsetId,
}: GetBroadcastMessagesInput) {
  const params = new URLSearchParams();

  if (limit) params.set('limit', String(limit));
  if (offsetSentAt) params.set('offsetSentAt', String(offsetSentAt));
  if (offsetId) params.set('offsetId', String(offsetId));

  const url = `/chat/broadcast${params.toString() ? `?${params}` : ''}`;
  const res = await api(url);

  return getBroadcastMessagesSchema.parse(res.data);
}
