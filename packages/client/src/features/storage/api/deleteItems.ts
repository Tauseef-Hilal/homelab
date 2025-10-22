import api from '@client/lib/api';
import { DeleteItemsInput } from '@shared/schemas/storage/request.schema';
import { deleteItemsSchema } from '@shared/schemas/storage/response.schema';

export async function deleteItems(data: DeleteItemsInput) {
  const res = await api.post('/storage/items/delete', data);
  return deleteItemsSchema.parse(res.data);
}
