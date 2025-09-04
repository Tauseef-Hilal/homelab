import api from '@client/lib/api';
import { ChangePasswordInput } from '@shared/schemas/auth/request/auth.schema';
import {
  ChangePasswordResponse,
  changePasswordSchema,
} from '@shared/schemas/auth/response/auth.schema';

export async function changePassword(data: ChangePasswordInput) {
  const res = await api.patch<ChangePasswordResponse>('/auth/password', data);
  return changePasswordSchema.parse(res.data);
}
