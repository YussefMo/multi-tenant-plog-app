export type SameSite = 'Lax' | 'Strict' | 'None';

export interface CookieOptions {
  days?: number;
  maxAge?: number;
  path?: string;
  domain?: string;
  sameSite?: SameSite;
  secure?: boolean;
}

const DEFAULT_PATH = '/';

function isBrowser(): boolean {
  return typeof document !== 'undefined';
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cookieString(name: string, value: string, options: CookieOptions = {}): string {
  const parts = [`${encode(name)}=${encode(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  } else if (options.days !== undefined) {
    parts.push(`Max-Age=${Math.floor(options.days * 24 * 60 * 60)}`);
  }

  parts.push(`Path=${options.path ?? DEFAULT_PATH}`);

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure ?? (isBrowser() && window.location.protocol === 'https:')) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export const cookies = {
  get(name: string): string | null {
    if (!isBrowser()) {
      return null;
    }

    const prefix = `${encode(name)}=`;
    const match = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));

    return match ? decode(match.slice(prefix.length)) || null : null;
  },

  set(name: string, value: string, options: CookieOptions = {}): void {
    if (!isBrowser()) {
      return;
    }

    document.cookie = cookieString(name, value, options);
  },

  remove(name: string, options: CookieOptions = {}): void {
    if (!isBrowser()) {
      return;
    }

    document.cookie = cookieString(name, '', { ...options, maxAge: 0 });
  },

  has(name: string): boolean {
    return this.get(name) !== null;
  },

  getAll(): Record<string, string> {
    if (!isBrowser()) {
      return {};
    }

    return document.cookie.split(';').reduce<Record<string, string>>((all, part) => {
      const trimmed = part.trim();

      if (!trimmed) {
        return all;
      }

      const separator = trimmed.indexOf('=');
      const key = separator === -1 ? trimmed : trimmed.slice(0, separator);
      const value = separator === -1 ? '' : trimmed.slice(separator + 1);

      all[decode(key)] = decode(value);

      return all;
    }, {});
  },

  getJson<T>(name: string): T | null {
    const value = this.get(name);

    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  setJson<T>(name: string, value: T, options: CookieOptions = {}): void {
    this.set(name, JSON.stringify(value), options);
  },
};
