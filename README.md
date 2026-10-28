# Multi Tenant Plog App

[![CI](https://github.com/YussefMo/multi-tenant-plog-app/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/YussefMo/multi-tenant-plog-app/actions/workflows/ci.yml)

Backend-only Laravel 13 API application. No Blade views, no frontend assets, no web routes — JSON in, JSON out.

## Requirements

- PHP 8.3+
- Composer 2
- Node.js 24+ and npm (for Prettier)
- MySQL / MariaDB

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Create the databases and point `.env` at them:

```sql
CREATE DATABASE multi_tenant_plog_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE multi_tenant_plog_app_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE multi_tenant_plog_owner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE multi_tenant_plog_owner_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=multi_tenant_plog_app
DB_USERNAME=root
DB_PASSWORD=

OWNER_DB_CONNECTION=mysql
OWNER_DB_HOST=127.0.0.1
OWNER_DB_PORT=3306
OWNER_DB_DATABASE=multi_tenant_plog_owner
OWNER_DB_USERNAME=root
OWNER_DB_PASSWORD=
```

Then migrate both databases:

```bash
php artisan migrate
php artisan migrate --database=owner --path=database/migrations/owner
```

Create the initial owner:

```bash
php artisan owner:create
```

## Run

Served by Nginx at **http://multi-tenant-plog.test** (server block: `/etc/nginx/sites-available/multi-tenant-plog-app`, PHP-FPM socket `/run/php/php8.3-fpm.sock`).

```bash
sudo nginx -t && sudo systemctl reload nginx
```

For a quick server without Nginx:

```bash
php artisan serve
```

## API

Base URL: `http://multi-tenant-plog.test/api`

| Method | Endpoint                         | Auth                     | Description                 |
| ------ | -------------------------------- | ------------------------ | --------------------------- |
| GET    | `/api/v1/csrf-token`             | Public                   | Tenant CSRF token + session |
| GET    | `/api/v1/owner/csrf-token`       | Public                   | Owner CSRF token + session  |
| POST   | `/api/v1/owner/auth/login`       | Public (CSRF)            | Owner login                 |
| POST   | `/api/v1/owner/auth/logout`      | Owner session            | Owner logout                |
| GET    | `/api/v1/owner/auth/me`          | Owner session            | Current owner               |
| GET    | `/api/v1/health`                 | Public                   | Health check                |
| GET    | `/api/v1/user`                   | Tenant session           | Current authenticated user  |
| POST   | `/api/v1/auth/login`             | Public (CSRF)            | Tenant login (email only)   |
| POST   | `/api/v1/auth/accept-invitation` | Public (CSRF)            | Accept tenant invitation    |
| POST   | `/api/v1/auth/logout`            | Tenant session           | Tenant logout               |
| GET    | `/api/v1/auth/me`                | Tenant session           | Current tenant user         |
| GET    | `/api/v1/tenant`                 | `tenant.settings.view`   | Tenant settings             |
| PATCH  | `/api/v1/tenant`                 | `tenant.settings.update` | Update tenant settings      |
| GET    | `/api/v1/posts`                  | `posts.view.*`           | List visible posts          |
| POST   | `/api/v1/posts`                  | `posts.create`           | Create a draft post         |
| GET    | `/api/v1/posts/{post}`           | `posts.view.*`           | Show a visible post         |
| PATCH  | `/api/v1/posts/{post}`           | `posts.update.*`         | Update a post               |
| DELETE | `/api/v1/posts/{post}`           | `posts.delete.*`         | Soft-delete a post          |
| POST   | `/api/v1/posts/{post}/publish`   | `posts.publish`          | Publish a post              |
| POST   | `/api/v1/posts/{post}/unpublish` | `posts.publish`          | Unpublish a post            |
| GET    | `/api/v1/users`                  | `users.view`             | List tenant users           |
| POST   | `/api/v1/users`                  | `users.create`           | Create tenant user          |
| GET    | `/api/v1/users/{user}`           | `users.view`             | Show tenant user            |
| PATCH  | `/api/v1/users/{user}`           | `users.update`           | Update tenant user          |
| DELETE | `/api/v1/users/{user}`           | `users.delete`           | Delete tenant user          |
| GET    | `/api/v1/profiles`               | `profiles.view`          | List permission profiles    |
| POST   | `/api/v1/profiles`               | `profiles.create`        | Create profile              |
| GET    | `/api/v1/profiles/{profile}`     | `profiles.view`          | Show profile                |
| PATCH  | `/api/v1/profiles/{profile}`     | `profiles.update`        | Update profile              |
| DELETE | `/api/v1/profiles/{profile}`     | `profiles.delete`        | Delete profile              |

All tenant endpoints require the tenant session. The `admin` role has `["*"]`; other roles use the presets in `config/permissions.php` plus their tenant-scoped profile and direct extras.

Tenant login is **email + password only** — the tenant is resolved from the globally unique email. Login and `/auth/me` return a fresh `csrf_token`. Owner tenant creation provisions the first admin with a null password and a 7-day invitation; accepting it sets the password.

Post visibility is permission-driven: admins see all tenant posts, authors see their own posts, and viewers see published posts. Every post query is tenant-scoped; cross-tenant IDs return 404.

Tenant and owner sessions use separate cookies: `tenant_session` and `owner_session`. Authentication is session + CSRF, not JWT or Bearer tokens.

1. `GET /api/v1/csrf-token` (or `/api/v1/owner/csrf-token`) to start the realm session and get the token.
2. Send `X-CSRF-TOKEN: <csrf_token>` on every POST/PUT/PATCH/DELETE.
3. Login regenerates the session and rotates the CSRF token; use the new `csrf_token` returned in the login response.
4. The built-in `XSRF-TOKEN` cookie is not used.

```bash
curl http://multi-tenant-plog.test/api/v1/health
```

## Tests

Tests run against the MySQL test database configured in `phpunit.xml`.

```bash
php artisan test
```

## Formatting

The project uses 2-space indentation everywhere.

```bash
npm install        # first time only
composer format    # PHP CS Fixer + Prettier
composer format:check
```

PHP CS Fixer formats PHP (`app/`, `bootstrap/`, `config/`, `database/`, `public/`, `routes/`, `tests/`, `artisan`); Prettier handles JSON, Markdown, YAML, and other supported files. Laravel Pint is not used.

## Type checking

```bash
composer type-check        # full PHPStan + Larastan report
composer type-check:files  # only files containing type errors
```

## IDE support

```bash
composer ide-helper
```

Generates `_ide_helper.php`, `_ide_helper_models.php`, and `.phpstorm.meta.php` for Laravel-aware autocompletion. The files are gitignored and should be regenerated after model or schema changes. VS Code Intelephense settings live in `.vscode/settings.json`; restart the language server after regenerating.

## CI

GitHub Actions runs on every push to `master`:

- `composer format:check`
- `composer type-check`
- `php artisan test` against MariaDB
- Production build (`composer install --no-dev`, `php artisan config:cache`, boot checks)

The workflow is `.github/workflows/ci.yml`.

## Structure

- `routes/api.php` — all application routes (API only)
- `app/Http/Controllers` — controllers
- `app/Models` — Eloquent models
- `database/migrations` — schema
- `bootstrap/app.php` — routing/middleware/exception configuration

All exceptions on `api/*` are rendered as JSON.
