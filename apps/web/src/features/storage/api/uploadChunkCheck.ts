import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';

export async function uploadChunkCheck(
  input: requestSchemas.UploadChunkCheckInput,
  signal?: AbortSignal,
) {
  const res = await api.post('/storage/upload/chunk/check', input, { signal });

  return responseSchemas.uploadChunkCheckSchema.parse(res.data);
}
