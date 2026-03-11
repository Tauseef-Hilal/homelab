'use client';

import api from '@client/lib/api';
import { useQuery } from '@tanstack/react-query';
import { responseSchemas } from '@homelab/shared/schemas/auth';
import { usePathname } from 'next/navigation';

export function useMe() {
  const pathname = usePathname();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return responseSchemas.meSchema.parse(res.data);
    },
    enabled: () => !pathname.startsWith('/auth'),
    staleTime: 1000 * 60 * 60,
  });
}
