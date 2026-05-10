import api from '@client/lib/api';
import { responseSchemas } from '@homelab/contracts/schemas/storage';

export async function fetchSharedWithMe(signal?: AbortSignal) {
  const res = await api.get(`/storage/list/shared`, {
    signal,
  });
  return responseSchemas.listSharedItemsSchema.parse(res.data);
}
