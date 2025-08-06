export const success = (data: any, message?: string) => ({
  status: 'success',
  data,
  ...(message && { message }),
});

export const error = (
  message: string,
  code = 'INTERNAL_ERROR',
  details?: any
) => ({
  status: 'error',
  message,
  code,
  ...(details && { details }),
});
