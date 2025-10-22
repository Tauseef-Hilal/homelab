import api from '@client/lib/api';
import { MoveItemsInput } from '@shared/schemas/storage/request.schema';
import { moveItemsSchema } from '@shared/schemas/storage/response.schema';

export async function moveItems(data: MoveItemsInput) {
  const res = await api.patch('/storage/items/move', data);
  return moveItemsSchema.parse(res.data);
}
