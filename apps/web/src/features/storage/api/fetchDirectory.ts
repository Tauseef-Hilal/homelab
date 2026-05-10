import api from '@client/lib/api';
import { responseSchemas } from '@homelab/contracts/schemas/storage';

export async function fetchDirectory(
  path: string,
  ownerId?: string,
  shareToken?: string,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ path });
  if (ownerId) params.append('ownerId', ownerId);
  if (shareToken) params.append('shareToken', shareToken);

  const res = await api.get(`/storage/list?${params.toString()}`, { signal });

  return responseSchemas.listDirectorySchema.parse(res.data);
}
