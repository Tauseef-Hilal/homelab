import api from '@client/lib/api';
import { responseSchemas } from '@homelab/shared/schemas/storage';

export async function listDirectory(path: string) {
  const res = await api.get(`/storage/list?path=${path}`);
  return responseSchemas.listDirectorySchema.parse(res.data);
}
