import { responseSchemas } from '@homelab/shared/schemas/jobs';
import { useQuery } from '@tanstack/react-query';
import { getJob } from '../api/getJob';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/shared/types';

export function useGetJob(id: string) {
  return useQuery<responseSchemas.GetJobOutput, AxiosError<ServerError>>({
    queryKey: [id],
    queryFn: () => getJob(id),
  });
}
