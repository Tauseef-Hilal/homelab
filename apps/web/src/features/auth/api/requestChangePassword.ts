import axios from '@client/lib/api';
import { requestSchemas, responseSchemas } from '@homelab/contracts/schemas/auth';

export async function requestChangePassword(
  data: requestSchemas.RequestChangePasswordInput,
) {
  const res = await axios.post<responseSchemas.RequestChangePasswordResponse>(
    '/auth/forgot-password',
    data,
  );
  return responseSchemas.requestChangePasswordSchema.parse(res.data);
}
