# Frontend Workspace

`frontend/` is the pnpm workspace root. Everything frontend-related lives here: the four Vite apps, the shared package, tests, Prettier, and the lockfile.

```text
frontend/
  apps/
    owner/        http://localhost:3000
    tenant/       http://localhost:3001
    user/         http://localhost:3002
    visualizer/   http://localhost:3003
  shared/
    ui/           all shadcn components
    lib/          http, cookies, toast, query, utils
    theme/        shared light/dark provider
    providers/    AppProviders + QueryProvider
    styles/       Tailwind + shadcn globals
  test/           Vitest setup
```

## Install and run

From the repository root:

```bash
pnpm install:frontend
pnpm dev                 # all four apps
pnpm dev:owner
pnpm dev:tenant
pnpm dev:user
pnpm dev:visualizer
```

The root `package.json` is a thin command bridge; every command delegates to `frontend/`.

## Shared package

Apps depend on `@multi-tenant-plog/shared`.

```ts
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { ThemeToggle } from '@multi-tenant-plog/shared/ui/theme-toggle';
import { AppProviders, QueryProvider } from '@multi-tenant-plog/shared/providers';
import { api, ownerApi } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { cookies } from '@multi-tenant-plog/shared/lib/cookies';
```

### HTTP

```ts
// owner app
import { ownerApi } from '@multi-tenant-plog/shared/lib/http';
await ownerApi.post('/tenants', payload);

// tenant and user apps
import { api } from '@multi-tenant-plog/shared/lib/http';
await api.post('/auth/login', payload);
```

The client reads `VITE_API_URL` and `VITE_API_VERSION` from the app `.env`, builds the base URL once, sends cookies with `withCredentials`, fetches the correct realm CSRF token, attaches `X-CSRF-TOKEN`, retries once on `419`, and emits auth events for `401`/`403`.

### Cookies

```ts
import { cookies } from '@multi-tenant-plog/shared/lib/cookies';

cookies.set('key', 'value', { days: 7 });
cookies.get('key');
cookies.remove('key');
cookies.setJson('profile', { id: 1 });
```

Laravel session cookies are HttpOnly; the browser sends them automatically through the axios instance. The cookies utility is for client-readable cookies only.

### Toasts

```ts
import { notify } from '@multi-tenant-plog/shared/lib/toast';

notify.success('Saved');
notify.error('Something failed');
notify.apiError(error);
notify.validation(errors);
```

`AppProviders` renders the Sonner `<Toaster />` once per app.

### TanStack Query

Owner, tenant, and user wrap their layouts in `QueryProvider`. The visualizer does not use TanStack Query.

### Theme

The shared `ThemeProvider` sets both `data-theme` and the `.dark` class, persists the choice, and exposes `useTheme`/`ThemeToggle`. The visualizer uses the storage key `atlas-theme`.

## Environment files

Each app has `.env` and `.env.example`:

```dotenv
VITE_API_URL=http://localhost:8000/api
VITE_API_VERSION=v1
VITE_APP_NAME=Owner Console
```

The axios base URL is `${VITE_API_URL}/${VITE_API_VERSION}`, so calls are relative:

```ts
api.post('/auth/login');
// -> http://localhost:8000/api/v1/auth/login
```

## Components

Reusable app components live in `shared/components`:

```text
components-parts/   tables, filters, forms, badges, spinners, modals
app-parts/          Can/Cannot, DeleteAlert, LogBlock, Logo, ToggleStatusDialog
```

They are built on the shared shadcn UI and use `@shared/lib/utils`. Import them directly:

```ts
import StatusBadge from '@multi-tenant-plog/shared/components/components-parts/StatusBadge';
import TableFooter from '@multi-tenant-plog/shared/components/components-parts/TableFooter';
import { Can } from '@multi-tenant-plog/shared/components/app-parts/Can';
import { DeleteAlert } from '@multi-tenant-plog/shared/components/app-parts/DeleteAlert';
```

No locale or i18n dependency is included.

## Tests

Vitest uses happy-dom and `@testing-library/jest-dom`:

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

Tests live only in test folders:

```text
frontend/test/                  shared/root tests
frontend/apps/<app>/test/       tests for that app
```

The root config runs one project per app plus the shared test project. Test files are never colocated with source files.

## Dependency catalog

All dependency and dev-dependency versions live in `frontend/pnpm-workspace.yaml` under `catalog:`. Apps and `shared` use `"catalog:"`.

To add or bump a package:

1. Update the version in `pnpm-workspace.yaml`.
2. Use `"catalog:"` in the package that needs it.
3. Run `pnpm --dir frontend install`.

## Type checking

Type checking uses `tsgo` from `@typescript/native-preview`. Each app includes `vite.config.ts` and its tests in the TypeScript project.

## Troubleshooting pnpm in WSL

If pnpm reports `no @pnpm/exe.linux-x64 native binary was found for this host`, install a native Linux pnpm and keep package-manager version management disabled:

```bash
rm -f ~/.local/bin/pnpm ~/.local/bin/pnpx
npm install -g pnpm@12.15.0 --prefix ~/.local --force
hash -r
which pnpm
pnpm -v
```

`which pnpm` should point to a Linux path such as `/home/youssef/.local/bin/pnpm` or `/home/youssef/.local/share/pnpm/bin/pnpm`, not `/mnt/c/...`.
