import { isAxiosError } from 'axios';

export interface ApiErrorBody {
  message?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errors: Record<string, string[]>;
  readonly cause?: unknown;

  constructor(message: string, status = 0, errors: Record<string, string[]> = {}, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.cause = cause;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    const status = error.response?.status ?? 0;
    const message =
      body?.message ??
      (status === 0 ? 'Network error. Check your connection and try again.' : error.message);

    return new ApiError(message, status, body?.errors ?? {}, error);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0, {}, error);
  }

  return new ApiError('Something went wrong. Please try again.', 0, {}, error);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function validationMessages(errors: Record<string, string[]>): string[] {
  return Object.values(errors).flat();
}
