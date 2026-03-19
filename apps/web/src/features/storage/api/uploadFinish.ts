import api from '@client/lib/api';
import { requestSchemas } from '@homelab/contracts/schemas/storage';

export async function uploadFinish(
  input: requestSchemas.UploadFinishInput,
  signal?: AbortSignal,
) {
  await api.post('/storage/upload/finish', input, { signal });
}
