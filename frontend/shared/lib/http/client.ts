import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { apiBaseUrl } from '@shared/lib/env';
import { toApiError, type ApiErrorBody } from './errors';
import { apiEvents } from './events';

export type ApiRealm = 'owner' | 'tenant';

export type HttpClient = AxiosInstance & {
  ensureCsrf: () => Promise<string>;
  clearCsrf: () => void;
};

interface RetryConfig extends InternalAxiosRequestConfig {
  _csrfRetry?: boolean;
}

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export function createHttpClient({ realm }: { realm: ApiRealm }): HttpClient {
  const csrfPath = realm === 'owner' ? '/owner/csrf-token' : '/csrf-token';
  let csrfToken: string | null = null;
  let csrfRequest: Promise<string> | null = null;

  const client = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
    timeout: 30_000,
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  }) as HttpClient;

  async function fetchCsrf(): Promise<string> {
    const response = await client.get<{ csrf_token: string }>(csrfPath);
    csrfToken = response.data.csrf_token;

    return csrfToken;
  }

  async function ensureCsrf(): Promise<string> {
    if (csrfToken !== null) {
      return csrfToken;
    }

    // Laravel encrypts the XSRF-TOKEN cookie, so the raw token must come from the realm endpoint.
    csrfRequest ??= fetchCsrf().finally(() => {
      csrfRequest = null;
    });

    return csrfRequest;
  }

  function clearCsrf(): void {
    csrfToken = null;
    csrfRequest = null;
  }

  client.ensureCsrf = ensureCsrf;
  client.clearCsrf = clearCsrf;

  client.interceptors.request.use(async (config) => {
    const method = (config.method ?? 'get').toLowerCase();

    if (MUTATING_METHODS.has(method)) {
      config.headers.set('X-CSRF-TOKEN', await ensureCsrf());
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const token = (response.data as { csrf_token?: unknown } | null)?.csrf_token;

      if (typeof token === 'string' && token !== '') {
        csrfToken = token;
      }

      return response;
    },
    async (error: AxiosError<ApiErrorBody>) => {
      const status = error.response?.status;
      const message = error.response?.data?.message ?? '';

      if (status === 401) {
        apiEvents.emit('unauthorized', error);
      }

      if (status === 403) {
        if (message.toLowerCase().includes('support')) {
          apiEvents.emit('support-ended', error);
        } else {
          apiEvents.emit('forbidden', error);
        }
      }

      if (status === 419) {
        const config = error.config as RetryConfig | undefined;

        if (config && config._csrfRetry !== true) {
          config._csrfRetry = true;
          clearCsrf();

          try {
            await ensureCsrf();

            return await client.request(config);
          } catch (retryError) {
            apiEvents.emit('csrf-failed', retryError);
          }
        } else {
          apiEvents.emit('csrf-failed', error);
        }
      }

      throw toApiError(error);
    },
  );

  return client;
}

export const ownerApi = createHttpClient({ realm: 'owner' });
export const tenantApi = createHttpClient({ realm: 'tenant' });
export const api = tenantApi;
