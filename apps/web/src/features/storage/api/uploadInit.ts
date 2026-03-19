import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';

export async function uploadInit(
  input: requestSchemas.UploadInitInput,
  idempotencyKey: string,
  signal?: AbortSignal,
) {
  const res = await api.post('/storage/upload/init', input, {
    headers: { 'x-idempotency-key': idempotencyKey },
    signal,
  });

  return responseSchemas.uploadInitSchema.parse(res.data);
}
