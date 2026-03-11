import api from '@client/lib/api';
import {
  requestSchemas,
  responseSchemas,
} from '@homelab/shared/schemas/storage';

export async function downloadItems(data: requestSchemas.DownloadItemsInput) {
  const res = await api.post('/storage/items/download', data);
  return responseSchemas.downloadItemsSchema.parse(res.data);
}
