import api from '@client/lib/api';
import { responseSchemas } from '@homelab/contracts/schemas/sharing';

export async function fetchUserShares(itemId: string, signal?: AbortSignal) {
  const res = await api.get(`/sharing/${itemId}/user`, {
    signal,
  });

  return responseSchemas.getUserSharesSchema.parse(res.data);
}
