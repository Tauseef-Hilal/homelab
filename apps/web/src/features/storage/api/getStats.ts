import api from '@client/lib/api';
import { responseSchemas } from '@homelab/contracts/schemas/storage';

export async function getStats() {
  const res = await api.get(`/storage/stats`);
  return responseSchemas.getStatsSchema.parse(res.data);
}
