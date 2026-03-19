import api from '@client/lib/api';
import { responseSchemas } from '@homelab/contracts/schemas/jobs';

export async function getJob(id: string) {
  const res = await api.get(`/jobs/${id}`);
  return responseSchemas.getJobSchema.parse(res.data);
}
