import api from '@client/lib/api';
import { responseSchemas } from '@homelab/contracts/schemas/sharing';

export async function fetchSharedLinks(itemId: string, signal?: AbortSignal) {
  const res = await api.get(`/sharing/${itemId}/link`, {
    signal,
  });

  return responseSchemas.getSharedLinksSchema.parse(res.data);
}
