import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';

export async function deleteItems(data: requestSchemas.DeleteItemsInput) {
  const res = await api.post('/storage/items/delete', data);
  return responseSchemas.deleteItemsSchema.parse(res.data);
}
