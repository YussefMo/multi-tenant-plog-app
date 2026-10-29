import { useMemo } from 'react';
import { useLocation, useNavigate, useParams as useRouterParams } from 'react-router-dom';

type NavigateOptions = { scroll?: boolean };

/**
 * Next-compatible router shim so app pages can use push/replace without importing
 * React Router directly. Mirrors the dashboard reference implementation.
 */
export function useRouter() {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      push: (href: string, options?: NavigateOptions) =>
        navigate(href, { preventScrollReset: options?.scroll === false }),
      replace: (href: string, options?: NavigateOptions) =>
        navigate(href, { replace: true, preventScrollReset: options?.scroll === false }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => {},
      prefetch: (_href: string) => {},
    }),
    [navigate],
  );
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams<
  T extends Record<string, string | string[] | undefined> = Record<string, string | undefined>,
>(): T {
  return useRouterParams() as T;
}
