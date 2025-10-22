import api from '@client/lib/api';
import { listDirectorySchema } from '@shared/schemas/storage/response.schema';

export async function listDirectory(path: string) {
  const res = await api.get(`/storage/list?path=${path}`);
  return listDirectorySchema.parse(res.data);
}
