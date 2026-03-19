import { timeout } from '@server/lib/timeout';
import { HealthCheckResult } from '@server/types/health';
import { getTransporter } from '@server/lib/email/email.service';

export async function checkEmail(): Promise<HealthCheckResult> {
  try {
    const transporter = getTransporter();
    await Promise.race([transporter.verify(), timeout(3000)]);

    return {
      name: 'email',
      status: 'ok',
    };
  } catch (err) {
    return {
      name: 'email',
      status: 'error',
      message:
        err instanceof Error && err.message === 'timeout'
          ? 'email timeout'
          : 'smtp unreachable',
    };
  }
}
