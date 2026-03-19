import { api } from '@client/lib/api';
import { responseSchemas } from '@homelab/contracts/schemas/auth';

export async function refresh() {
  const res = await api.post('/auth/refresh');
  return responseSchemas.refreshSchema.parse(res.data);
}
