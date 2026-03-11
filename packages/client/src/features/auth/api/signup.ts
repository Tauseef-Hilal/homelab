import axios from '@client/lib/api';
import { requestSchemas, responseSchemas } from '@homelab/shared/schemas/auth';

export async function signup(data: requestSchemas.SignupInput) {
  const res = await axios.post<responseSchemas.SignupResponse>(
    '/auth/signup',
    data,
  );
  return responseSchemas.signupSchema.parse(res.data);
}
