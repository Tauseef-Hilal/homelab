'use client';

import api from '@client/lib/api';
import { useQuery } from '@tanstack/react-query';
import { meSchema } from '@shared/schemas/auth/response/auth.schema';
import { usePathname } from 'next/navigation';

export function useMe() {
  const pathname = usePathname();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return meSchema.parse(res.data);
    },
    enabled: () => !pathname.startsWith('/auth'),
    staleTime: 1000 * 60 * 60,
  });
}
