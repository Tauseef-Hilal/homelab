type HttpErrorOptions = {
  status: number;
  code: string;
  message: string;
};

export class HttpError extends Error {
  status: number;
  code: string;

  constructor({ status, code, message }: HttpErrorOptions) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'HttpError';
    Error.captureStackTrace(this, this.constructor);
  }
}
