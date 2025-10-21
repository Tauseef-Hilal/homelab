import api from '@client/lib/api';
import { getJobSchema } from '@shared/schemas/jobs/response/job.schema';

export async function getJob(id: string) {
  const res = await api.get(`/jobs/${id}`);
  return getJobSchema.parse(res.data);
}
