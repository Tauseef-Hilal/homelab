import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';

export async function createFolder(data: requestSchemas.CreateFolderInput) {
  const res = await api.post('/storage/folder', data);
  return responseSchemas.createFolderSchema.parse(res.data);
}
