import api from '@client/lib/api';
import { LogoutInput } from '@shared/schemas/auth/request/auth.schema';
import {
  LogoutResponse,
  logoutSchema,
} from '@shared/schemas/auth/response/auth.schema';

export async function logout(data: LogoutInput) {
  const res = await api.post<LogoutResponse>('/auth/logout', data);
  return logoutSchema.parse(res.data);
}
