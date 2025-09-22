import api from '@client/lib/api';
import { UploadFileInput } from '@shared/schemas/storage/request/file.schema';
import { uploadFileSchema } from '@shared/schemas/storage/response/file.schema';

export async function uploadFile(data: UploadFileInput) {
  const res = await api.post('/storage/file', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return uploadFileSchema.parse(res.data);
}
