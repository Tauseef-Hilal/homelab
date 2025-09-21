import api from '@client/lib/api';

export async function listDirectory(path: string) {
  const res = await api.get(`/storage/list?path=${path}`);
  return res.data;
}
