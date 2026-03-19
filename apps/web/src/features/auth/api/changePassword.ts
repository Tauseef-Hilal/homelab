import api from '@client/lib/api';
import { requestSchemas, responseSchemas } from '@homelab/contracts/schemas/auth';

export async function changePassword(data: requestSchemas.ChangePasswordInput) {
  const res = await api.patch<responseSchemas.ChangePasswordResponse>(
    '/auth/password',
    data,
  );
  return responseSchemas.changePasswordSchema.parse(res.data);
}
