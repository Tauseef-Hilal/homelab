import api from '@client/lib/api';
import { DownloadItemsInput } from '@shared/schemas/storage/request.schema';
import { downloadItemsSchema } from '@shared/schemas/storage/response.schema';

export async function downloadItems(data: DownloadItemsInput) {
  const res = await api.post('/storage/items/download', data);
  return downloadItemsSchema.parse(res.data);
}
