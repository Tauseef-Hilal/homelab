import api from '@client/lib/api';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/chat';

export async function getBroadcastMessages({
  cursorId,
  cursorSentAt,
  limit,
}: requestSchemas.GetBroadcastMessagesInput) {
  const params = new URLSearchParams();

  if (limit) params.set('limit', String(limit));
  if (cursorId && cursorSentAt) {
    params.set('cursorId', String(cursorId));
    params.set('cursorSentAt', String(cursorSentAt));
  }

  const url = `/chat/broadcast${params.toString() ? `?${params}` : ''}`;
  const res = await api(url);

  return responseSchemas.getBroadcastMessagesSchema.parse(res.data);
}
