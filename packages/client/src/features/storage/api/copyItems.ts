import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';

export async function copyItems(data: requestSchemas.CopyItemsInput) {
  const res = await api.post('/storage/items/copy', data);
  return responseSchemas.copyItemsSchema.parse(res.data);
}
