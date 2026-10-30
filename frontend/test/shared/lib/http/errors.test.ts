import { describe, expect, it } from 'vitest';
import { ApiError, toApiError, validationMessages } from '@shared/lib/http/errors';

describe('api errors', () => {
  it('normalizes a plain error', () => {
    const error = toApiError(new Error('Boom'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Boom');
    expect(error.status).toBe(0);
  });

  it('keeps validation errors', () => {
    const error = toApiError(new ApiError('Invalid', 422, { email: ['Taken'] }));

    expect(error.status).toBe(422);
    expect(validationMessages(error.errors)).toEqual(['Taken']);
  });
});
