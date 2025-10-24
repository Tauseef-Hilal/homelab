import api from '@client/lib/api';
import { useQuery } from '@tanstack/react-query';
import { meSchema } from '@shared/schemas/auth/response/auth.schema';

export function useMe() {
  return useQuery({
    queryKey: [],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return meSchema.parse(res.data);
    },
  });
}
