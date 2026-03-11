import api from '@client/lib/api';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/auth';

export async function logout(data: requestSchemas.LogoutInput) {
  const res = await api.post<responseSchemas.LogoutResponse>(
    '/auth/logout',
    data,
  );
  return responseSchemas.logoutSchema.parse(res.data);
}
