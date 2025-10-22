import { useQuery } from '@tanstack/react-query';
import { listDirectory } from '../api/listDirectory';
import { AxiosError } from 'axios';
import { ServerError } from '@shared/types/error';
import { ListDirectoryResponse } from '@shared/schemas/storage/response.schema';

export function useListDirectory(path: string, enabled: boolean) {
  return useQuery<ListDirectoryResponse, AxiosError<ServerError>>({
    queryKey: ['listDirectory', path],
    queryFn: () => listDirectory(path),
    enabled,
  });
}
