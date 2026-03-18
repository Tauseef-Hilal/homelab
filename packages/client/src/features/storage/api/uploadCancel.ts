import api from '@client/lib/api';
import { requestSchemas } from '@homelab/shared/schemas/storage';

export async function uploadCancel(
  input: requestSchemas.UploadCancelInput,
  signal?: AbortSignal,
) {
  await api.post('/storage/upload/cancel', input, {
    headers: { 'x-idempotency-key': crypto.randomUUID() },
    signal,
  });
}
