import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';

export async function deleteItems(data: requestSchemas.DeleteItemsInput) {
  const res = await api.post('/storage/items/delete', data, {
    headers: { 'x-idempotency-key': crypto.randomUUID() },
  });
  return responseSchemas.deleteItemsSchema.parse(res.data);
}
