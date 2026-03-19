import axios from '@client/lib/api';
import { requestSchemas, responseSchemas } from '@homelab/contracts/schemas/auth';

export async function verify(data: requestSchemas.VerifyOtpInput) {
  const res = await axios.post<responseSchemas.VerifyOtpResponse>(
    '/auth/verify-otp',
    data,
  );
  return responseSchemas.verifyOtpSchema.parse(res.data);
}
