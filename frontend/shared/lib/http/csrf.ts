import { cookies } from '@shared/lib/cookies';

export function readCsrfCookie(): string | null {
  return cookies.get('XSRF-TOKEN');
}
