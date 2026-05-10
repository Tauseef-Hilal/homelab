import { useQuery } from '@tanstack/react-query';
import useDriveStore from '../stores/drive.store';
import { fetchDirectory } from '../api/fetchDirectory';
import useAuthStore from '@client/stores/auth.store';
import { fetchSharedWithMe } from '../api/fetchShared';
import { responseSchemas } from '@homelab/contracts/schemas/storage';
import { AxiosError } from 'axios';
import { ServerError } from '@homelab/contracts/types';
import { fetchLink } from '../api/fetchLink';

export function useDriveContents() {
  const user = useAuthStore((s) => s.user);
  const path = useDriveStore((s) => s.path);
  const ownerId = useDriveStore((s) => s.ownerId);
  const viewContext = useDriveStore((s) => s.viewContext);
  const shareToken = useDriveStore((s) => s.shareToken);

  return useQuery<
    responseSchemas.ListDirectoryResponse,
    AxiosError<ServerError>
  >({
    queryKey: ['drive', viewContext, path, ownerId, shareToken],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: AxiosError) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
    queryFn: async ({ signal }) => {
      if (viewContext == 'shared' && path === '/') {
        const sharedItems = await fetchSharedWithMe(signal);

        return {
          folder: {
            id: 'virtual-shared-root',
            name: 'Shared With Me',
            fullPath: '/',
            parentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: '',
            files: sharedItems.files,
            children: sharedItems.folders,
            permissions: {
              read: true,
              share: false,
              copy: false,
              delete: false,
              write: false,
            },
          },
        };
      }

      if (viewContext == 'link' && path === '/') {
        const sharedItems = await fetchLink(shareToken ?? '', signal);

        return {
          folder: {
            id: 'virtual-shared-root',
            name: 'Shared With Me',
            fullPath: '/',
            parentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: '',
            files: sharedItems.files,
            children: sharedItems.folders,
            permissions: {
              read: true,
              share: false,
              copy: false,
              delete: false,
              write: false,
            },
          },
        };
      }

      const data = await fetchDirectory(path, ownerId, shareToken, signal);

      return data;
    },
  });
}
