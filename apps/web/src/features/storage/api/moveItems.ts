import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/contracts/schemas/storage';

export async function moveItems(data: requestSchemas.MoveItemsInput) {
  const res = await api.patch('/storage/items/move', data, {
    headers: { 'x-idempotency-key': crypto.randomUUID() },
  });
  return responseSchemas.moveItemsSchema.parse(res.data);
}
