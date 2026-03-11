import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';

export async function moveItems(data: requestSchemas.MoveItemsInput) {
  const res = await api.patch('/storage/items/move', data);
  return responseSchemas.moveItemsSchema.parse(res.data);
}
