'use client';

import api from '@client/lib/api';
import { useQuery } from '@tanstack/react-query';
import { responseSchemas } from '@homelab/shared/schemas/auth';
import { usePathname } from 'next/navigation';
import useAuthStore from '@client/stores/auth.store';

export function useMe() {
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !pathname.startsWith('/auth') && !!accessToken,
    staleTime: Infinity,
  });
}

async function getMe() {
  const res = await api.get('/auth/me');
  return responseSchemas.meSchema.parse(res.data);
}
