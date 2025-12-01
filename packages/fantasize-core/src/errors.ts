export class DomainError extends Error {
  readonly code: string;
  constructor(code: string, message?: string, options?: ErrorOptions) {
    super(message ?? code, options);
    this.code = code;
    this.name = 'DomainError';
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}
