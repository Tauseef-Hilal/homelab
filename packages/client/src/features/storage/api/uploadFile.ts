import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';

export async function uploadFile(data: requestSchemas.UploadFileInput) {
  const res = await api.post('/storage/file', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return responseSchemas.uploadFileSchema.parse(res.data);
}
