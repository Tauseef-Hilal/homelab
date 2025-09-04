import axios from '@client/lib/api';
import { RequestChangePasswordInput } from '@shared/schemas/auth/request/auth.schema';
import {
  RequestChangePasswordResponse,
  requestChangePasswordSchema,
} from '@shared/schemas/auth/response/auth.schema';

export async function requestChangePassword(data: RequestChangePasswordInput) {
  const res = await axios.post<RequestChangePasswordResponse>(
    '/auth/forgot-password',
    data
  );
  return requestChangePasswordSchema.parse(res.data);
}
