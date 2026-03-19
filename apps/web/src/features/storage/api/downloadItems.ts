import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';

export async function downloadItems(data: requestSchemas.DownloadItemsInput) {
  const res = await api.post('/storage/items/download', data, {
    headers: { 'x-idempotency-key': crypto.randomUUID() },
  });
  return responseSchemas.downloadItemsSchema.parse(res.data);
}
