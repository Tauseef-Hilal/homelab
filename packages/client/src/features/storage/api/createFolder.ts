import api from '@client/lib/api';
import { CreateFolderInput } from '@shared/schemas/storage/request/folder.schema';
import { createFolderSchema } from '@shared/schemas/storage/response/folder.schema';

export async function createFolder(data: CreateFolderInput) {
  const res = await api.post('/storage/folder', data);
  return createFolderSchema.parse(res.data);
}
