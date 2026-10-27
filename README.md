# Multi Tenant Plog App

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

| Method | Endpoint                    | Auth           | Description                 |
| ------ | --------------------------- | -------------- | --------------------------- |
| GET    | `/api/v1/csrf-token`        | Public         | Tenant CSRF token + session |
| GET    | `/api/v1/owner/csrf-token`  | Public         | Owner CSRF token + session  |
| POST   | `/api/v1/owner/auth/login`  | Public (CSRF)  | Owner login                 |
| POST   | `/api/v1/owner/auth/logout` | Owner session  | Owner logout                |
| GET    | `/api/v1/owner/auth/me`     | Owner session  | Current owner               |
| GET    | `/api/v1/health`            | Public         | Health check                |
| GET    | `/api/v1/user`              | Tenant session | Current authenticated user  |

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

## Structure

- `routes/api.php` — all application routes (API only)
- `app/Http/Controllers` — controllers
- `app/Models` — Eloquent models
- `database/migrations` — schema
- `bootstrap/app.php` — routing/middleware/exception configuration

All exceptions on `api/*` are rendered as JSON.
