import api from '@client/lib/api';
import { getStatsSchema } from '@shared/schemas/storage/response.schema';

export async function getStats() {
  const res = await api.get(`/storage/stats`);
  return getStatsSchema.parse(res.data);
}
