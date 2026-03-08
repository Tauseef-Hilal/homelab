export type HealthCheckResult = {
  name: string;
  status: 'ok' | 'error';
  message?: string;
};
