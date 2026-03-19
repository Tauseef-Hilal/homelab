import api from '@client/lib/api';
import { responseSchemas } from '@homelab/contracts/schemas/storage';

export async function listDirectory(path: string, signal?: AbortSignal) {
  const res = await api.get(`/storage/list?path=${path}`, { signal });
  return responseSchemas.listDirectorySchema.parse(res.data);
}
