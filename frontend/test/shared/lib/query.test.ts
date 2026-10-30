import { describe, expect, it } from 'vitest';
import { queryClient } from '@shared/lib/query';

describe('query client', () => {
  it('disables caching until a query is explicitly approved', () => {
    const options = queryClient.getDefaultOptions().queries;

    expect(options?.staleTime).toBe(0);
    expect(options?.gcTime).toBe(0);
  });
});
