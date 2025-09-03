export const success = (data: object, message?: string) => ({
  status: 'success',
  ...data,
  ...(message && { message }),
});

export const error = (
  message: string,
  code = 'INTERNAL_ERROR',
  details?: object
) => ({
  status: 'error',
  message,
  code,
  details,
});
