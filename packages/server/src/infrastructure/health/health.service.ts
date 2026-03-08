import { HealthCheckResult } from '@server/types/health';
import { checkPostgres } from './checks/postgres.check';
import { checkRedis } from './checks/redis.check';
import { checkStorage } from './checks/storage.check';
import { checkEmail } from './checks/email.check';

export async function runHealthChecks() {
  const checks = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkStorage(),
    checkEmail(),
  ]);

  const status = checks.some((c: HealthCheckResult) => c.status === 'error')
    ? 'error'
    : 'ok';

  return {
    status,
    checks,
  };
}
