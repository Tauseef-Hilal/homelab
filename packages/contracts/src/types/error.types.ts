export type ServerError = {
  code: string;
  message: string;
  details?: { fieldErrors?: Record<string, string[]> };
};
