# Multi Tenant Plog App

Backend-only Laravel 13 API application. No Blade views, no frontend assets, no web routes — JSON in, JSON out.

## Requirements

- PHP 8.3+
- Composer 2
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
```

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=multi_tenant_plog_app
DB_USERNAME=root
DB_PASSWORD=
```

Then migrate:

```bash
php artisan migrate
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

| Method | Endpoint          | Auth          | Description           |
| ------ | ----------------- | ------------- | --------------------- |
| GET    | `/api/v1/health`  | Public        | Health check          |
| GET    | `/api/v1/user`    | Sanctum token | Current authenticated user |

Authentication uses Laravel Sanctum personal access tokens (Bearer tokens), not session/SPA auth.

```bash
curl http://localhost:8000/api/v1/health
```

## Tests

Tests run against the MySQL test database configured in `phpunit.xml`.

```bash
php artisan test
```

## Structure

- `routes/api.php` — all application routes (API only)
- `app/Http/Controllers` — controllers
- `app/Models` — Eloquent models
- `database/migrations` — schema
- `bootstrap/app.php` — routing/middleware/exception configuration

All exceptions on `api/*` are rendered as JSON.
