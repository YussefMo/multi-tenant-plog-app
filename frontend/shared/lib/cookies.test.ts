import { beforeEach, describe, expect, it } from 'vitest';
import { cookies } from './cookies';

function clearCookies(): void {
  for (const name of Object.keys(cookies.getAll())) {
    cookies.remove(name);
  }
}

describe('cookies', () => {
  beforeEach(() => {
    clearCookies();
  });

  it('stores and reads a cookie', () => {
    cookies.set('theme', 'dark');

    expect(cookies.get('theme')).toBe('dark');
    expect(cookies.has('theme')).toBe(true);
  });

  it('returns null for a missing cookie', () => {
    expect(cookies.get('missing')).toBeNull();
  });

  it('stores and reads JSON', () => {
    cookies.setJson('profile', { id: 7, name: 'Demo' });

    expect(cookies.getJson<{ id: number; name: string }>('profile')).toEqual({
      id: 7,
      name: 'Demo',
    });
  });

  it('removes a cookie', () => {
    cookies.set('token', 'abc');
    cookies.remove('token');

    expect(cookies.get('token')).toBeNull();
  });
});
