import api from '@client/lib/api';
import { CopyItemsInput } from '@shared/schemas/storage/request.schema';
import { copyItemsSchema } from '@shared/schemas/storage/response.schema';

export async function copyItems(data: CopyItemsInput) {
  const res = await api.post('/storage/items/copy', data);
  return copyItemsSchema.parse(res.data);
}
