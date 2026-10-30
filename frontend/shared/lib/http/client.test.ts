import type { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { createHttpClient } from './client';

describe('http client', () => {
  it('uses the API base URL and credentials', () => {
    const client = createHttpClient({ realm: 'tenant' });

    expect(client.defaults.baseURL).toBe('http://localhost:8000/api/v1');
    expect(client.defaults.withCredentials).toBe(true);
  });

  it('fetches and attaches the CSRF token for mutations', async () => {
    const client = createHttpClient({ realm: 'owner' });
    const calls: InternalAxiosRequestConfig[] = [];

    client.defaults.adapter = async (config) => {
      calls.push(config);

      return {
        data: config.url === '/owner/csrf-token' ? { csrf_token: 'csrf-owner' } : { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await client.post('/tenants', { name: 'Demo' });

    expect(calls[0]?.url).toBe('/owner/csrf-token');
    expect((calls[1]?.headers as AxiosHeaders)?.get('X-CSRF-TOKEN')).toBe('csrf-owner');
  });
});
