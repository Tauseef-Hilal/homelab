import axios from '@client/lib/api';
import { VerifyOtpInput } from '@shared/schemas/auth/request/auth.schema';
import {
  VerifyOtpResponse,
  verifyOtpSchema,
} from '@shared/schemas/auth/response/auth.schema';

export async function verify(data: VerifyOtpInput) {
  const res = await axios.post<VerifyOtpResponse>('/auth/verify-otp', data);
  return verifyOtpSchema.parse(res.data);
}
