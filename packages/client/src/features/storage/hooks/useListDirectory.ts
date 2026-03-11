import { useQuery } from '@tanstack/react-query';
import { listDirectory } from '../api/listDirectory';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/shared/types';
import { responseSchemas } from '@homelab/shared/schemas/storage';

export function useListDirectory(path: string, enabled: boolean) {
  return useQuery<
    responseSchemas.ListDirectoryResponse,
    AxiosError<ServerError>
  >({
    queryKey: ['listDirectory', path],
    queryFn: () => listDirectory(path),
    enabled,
  });
}
