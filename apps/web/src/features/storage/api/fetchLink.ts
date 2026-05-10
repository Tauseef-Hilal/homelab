import api from '@client/lib/api';
import { responseSchemas } from '@homelab/contracts/schemas/storage';

export async function fetchLink(shareToken: string, signal?: AbortSignal) {
  const res = await api.get(`/storage/list/link?shareToken=${shareToken}`, {
    signal,
  });
  return responseSchemas.listSharedItemsSchema.parse(res.data);
}
