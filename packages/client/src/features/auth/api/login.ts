import axios from '@client/lib/api';
import { LoginInput } from '@shared/schemas/auth/request/auth.schema';
import {
  LoginResponse,
  loginSchema,
} from '@shared/schemas/auth/response/auth.schema';

export async function login(data: LoginInput) {
  const res = await axios.post<LoginResponse>('/auth/login', data);
  return loginSchema.parse(res.data);
}
