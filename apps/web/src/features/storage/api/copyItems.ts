import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';

export async function copyItems(data: requestSchemas.CopyItemsInput) {
  const res = await api.post('/storage/items/copy', data, {
    headers: { 'x-idempotency-key': crypto.randomUUID() },
  });
  return responseSchemas.copyItemsSchema.parse(res.data);
}
