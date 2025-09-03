import axios from '@client/lib/api';
import { SignupInput } from '@shared/schemas/auth/request/auth.schema';
import {
  SignupResponse,
  signupSchema,
} from '@shared/schemas/auth/response/auth.schema';

export async function signup(data: SignupInput) {
  const res = await axios.post<SignupResponse>('/auth/signup', data);
  return signupSchema.parse(res.data);
}
