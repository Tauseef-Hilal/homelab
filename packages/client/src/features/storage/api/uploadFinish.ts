import api from '@client/lib/api';
import { requestSchemas } from '@homelab/shared/schemas/storage';

export async function uploadFinish(
  input: requestSchemas.UploadFinishInput,
  signal?: AbortSignal,
) {
  await api.post('/storage/upload/finish', input, { signal });
}
