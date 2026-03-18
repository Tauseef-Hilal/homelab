import api from '@client/lib/api';
import { requestSchemas } from '@homelab/shared/schemas/storage';

export async function uploadChunk(
  blob: Blob,
  headers: requestSchemas.UploadChunkHeaderInput,
  signal?: AbortSignal,
) {
  await api.put('/storage/upload/chunk', blob, {
    signal,
    headers: { ...headers, 'Content-Type': 'application/octet-stream' },
  });
}
