import axios from '@client/lib/api';
import { requestSchemas, responseSchemas } from '@homelab/contracts/schemas/auth';

export async function login(data: requestSchemas.LoginInput) {
  const res = await axios.post<responseSchemas.LoginResponse>(
    '/auth/login',
    data,
  );
  return responseSchemas.loginSchema.parse(res.data);
}
