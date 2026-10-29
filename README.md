# Multi Tenant Plog App

[![CI](https://github.com/YussefMo/multi-tenant-plog-app/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/YussefMo/multi-tenant-plog-app/actions/workflows/ci.yml)

Backend-only Laravel 13 API application. No application Blade views, no frontend assets, and no application web UI — JSON in, JSON out. The only HTML page is the local OpenAPI documentation UI.

## Requirements

- PHP 8.3+
- Composer 2
- Node.js 24+ and pnpm 12+ (for Prettier and frontend apps)
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

PUBLIC_API_URL=http://multi-tenant-plog.test
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

Optional local demo data:

```bash
php artisan db:seed --class=DemoSeeder
```

This creates 2 tenants, 100 large posts, admin/author/viewer/support users, subscriptions, 12 months of invoices and payments, and chart-ready billing metrics.

Seeded billing rows are local-only mirror data. `checkout` and `portal` can create real Stripe sandbox resources when called; `cancel` needs a real Stripe subscription from a completed checkout.

Demo logins:

```text
Owner:          owner@example.com   / password123
Tenant 1 admin: admin@demo.test     / password
Tenant 1 author:author@demo.test    / password
Tenant 2 admin: admin2@demo.test    / password
Tenant 2 author:author2@demo.test   / password
Viewer:         viewer@demo.test    / password
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

### API documentation

OpenAPI 3.1 docs with request/response schemas and **Try it out**:

```text
http://multi-tenant-plog.test/docs/api
```

Raw OpenAPI JSON:

```text
http://multi-tenant-plog.test/docs/api.json
```

The docs are protected with HTTP Basic auth using `DOCS_USERNAME` and `DOCS_PASSWORD`:

```dotenv
DOCS_USERNAME=docs
DOCS_PASSWORD=change-me
```

```bash
curl -u docs:change-me http://multi-tenant-plog.test/docs/api.json
```

If either value is empty, the docs return `503` instead of exposing the spec.

The docs UI automatically fetches the correct tenant or owner CSRF token and sends the session cookie before mutating requests. Log in through the matching login endpoint, then try protected endpoints.

Owner authentication is separate from tenant authentication:

```text
POST /api/v1/owner/auth/login
GET  /api/v1/owner/auth/me
POST /api/v1/owner/auth/logout
```

All owner auth operations appear in the `Auth` tag in the docs.

Regenerate the static spec with:

```bash
php artisan scramble:export
```

The docs server URL uses `PUBLIC_API_URL`, so it follows the ngrok hostname.

| Method | Endpoint                                 | Auth                     | Description                 |
| ------ | ---------------------------------------- | ------------------------ | --------------------------- |
| GET    | `/api/v1/csrf-token`                     | Public                   | Tenant CSRF token + session |
| GET    | `/api/v1/owner/csrf-token`               | Public                   | Owner CSRF token + session  |
| POST   | `/api/v1/owner/auth/login`               | Public (CSRF)            | Owner login                 |
| POST   | `/api/v1/owner/auth/logout`              | Owner session            | Owner logout                |
| GET    | `/api/v1/owner/auth/me`                  | Owner session            | Current owner               |
| GET    | `/api/v1/owner/tenants`                  | Owner session            | List owned tenants          |
| POST   | `/api/v1/owner/tenants`                  | Owner session            | Create tenant + admin       |
| GET    | `/api/v1/owner/tenants/{tenant}`         | Owner session            | Show tenant                 |
| PATCH  | `/api/v1/owner/tenants/{tenant}`         | Owner session            | Update tenant               |
| DELETE | `/api/v1/owner/tenants/{tenant}`         | Owner session            | Soft-delete tenant          |
| POST   | `/api/v1/owner/tenants/{tenant}/restore` | Owner session            | Restore tenant              |
| POST   | `/api/v1/owner/tenants/{tenant}/access`  | Owner session            | Request support ticket      |
| GET    | `/api/v1/owner/plans`                    | Owner session            | List plans                  |
| POST   | `/api/v1/owner/plans`                    | Owner session            | Create plan                 |
| GET    | `/api/v1/owner/plans/{plan}`             | Owner session            | Show plan                   |
| PATCH  | `/api/v1/owner/plans/{plan}`             | Owner session            | Update plan                 |
| DELETE | `/api/v1/owner/plans/{plan}`             | Owner session            | Delete plan                 |
| GET    | `/api/v1/owner/billing/metrics`          | Owner session            | Billing metrics             |
| GET    | `/api/v1/owner/billing/transactions`     | Owner session            | Billing transactions        |
| GET    | `/api/v1/health`                         | Public                   | Health check                |
| GET    | `/up`                                    | Public                   | Framework health check      |
| GET    | `/api/v1/user`                           | Tenant session           | Current authenticated user  |
| POST   | `/api/v1/auth/login`                     | Public (CSRF)            | Tenant login (email only)   |
| POST   | `/api/v1/auth/register`                  | Public (CSRF)            | Viewer signup               |
| POST   | `/api/v1/auth/accept-invitation`         | Public (CSRF)            | Accept tenant invitation    |
| POST   | `/api/v1/auth/logout`                    | Tenant session           | Tenant logout               |
| GET    | `/api/v1/auth/me`                        | Tenant session           | Current tenant user         |
| POST   | `/api/v1/auth/support-login`             | Ticket                   | Exchange support ticket     |
| POST   | `/api/v1/auth/support/end`               | Tenant session           | End support session         |
| GET    | `/api/v1/tenant`                         | `tenant.settings.view`   | Tenant settings             |
| PATCH  | `/api/v1/tenant`                         | `tenant.settings.update` | Update tenant settings      |
| GET    | `/api/v1/tenants`                        | `tenants.view`           | Viewer tenant directory     |
| GET    | `/api/v1/tenants/{tenant}/posts`         | `tenants.view`           | Published tenant posts      |
| GET    | `/api/v1/billing/plans`                  | `billing.view`           | Active plans                |
| GET    | `/api/v1/billing/subscription`           | `billing.view`           | Current subscription        |
| GET    | `/api/v1/billing/invoices`               | `billing.view`           | Tenant invoices             |
| GET    | `/api/v1/billing/payments`               | `billing.view`           | Tenant payments             |
| POST   | `/api/v1/billing/checkout`               | `billing.manage`         | Create Checkout Session     |
| POST   | `/api/v1/billing/portal`                 | `billing.manage`         | Create Customer Portal      |
| POST   | `/api/v1/billing/cancel`                 | `billing.manage`         | Cancel at period end        |
| GET    | `/api/v1/billing/checkout/success`       | Stripe redirect          | Checkout success redirect   |
| GET    | `/api/v1/billing/checkout/cancel`        | Stripe redirect          | Checkout cancel redirect    |
| GET    | `/api/v1/billing/portal/return`          | Stripe redirect          | Portal return redirect      |
| POST   | `/api/v1/stripe/webhook`                 | Stripe signature         | Stripe webhook              |
| GET    | `/api/v1/posts`                          | `posts.view.*`           | List visible posts          |
| POST   | `/api/v1/posts`                          | `posts.create`           | Create a draft post         |
| GET    | `/api/v1/posts/{post}`                   | `posts.view.*`           | Show a visible post         |
| PATCH  | `/api/v1/posts/{post}`                   | `posts.update.*`         | Update a post               |
| DELETE | `/api/v1/posts/{post}`                   | `posts.delete.*`         | Soft-delete a post          |
| POST   | `/api/v1/posts/{post}/publish`           | `posts.publish`          | Publish a post              |
| POST   | `/api/v1/posts/{post}/unpublish`         | `posts.publish`          | Unpublish a post            |
| GET    | `/api/v1/users`                          | `users.view`             | List tenant users           |
| POST   | `/api/v1/users`                          | `users.create`           | Create tenant user          |
| GET    | `/api/v1/users/{user}`                   | `users.view`             | Show tenant user            |
| PATCH  | `/api/v1/users/{user}`                   | `users.update`           | Update tenant user          |
| DELETE | `/api/v1/users/{user}`                   | `users.delete`           | Delete tenant user          |
| GET    | `/api/v1/profiles`                       | `profiles.view`          | List permission profiles    |
| POST   | `/api/v1/profiles`                       | `profiles.create`        | Create profile              |
| GET    | `/api/v1/profiles/{profile}`             | `profiles.view`          | Show profile                |
| PATCH  | `/api/v1/profiles/{profile}`             | `profiles.update`        | Update profile              |
| DELETE | `/api/v1/profiles/{profile}`             | `profiles.delete`        | Delete profile              |

All tenant endpoints require the tenant session. The `admin` role has `["*"]`; other roles use the presets in `config/permissions.php` plus their tenant-scoped profile and direct extras.

Tenant login is **email + password only** — the tenant is resolved from the globally unique email. Login and `/auth/me` return a fresh `csrf_token`. Owner tenant creation provisions the first admin with a null password and a 7-day invitation; accepting it sets the password.

Post visibility is permission-driven: admins see all tenant posts, authors see their own posts, and viewers see published posts. Every post query is tenant-scoped; cross-tenant IDs return 404.

Owner support access requires the tenant’s `allow_support` flag. The owner receives a single-use 5-minute ticket, exchanges it for a tenant support session, and acts as the hidden “Owner Support” user (`is_support`, admin, `["*"]`). Every support session is audited, and disabling `allow_support` revokes the tenant session on the next request.

Tenant and owner sessions use separate cookies: `tenant_session` and `owner_session`. Authentication is session + CSRF, not JWT or Bearer tokens.

1. `GET /api/v1/csrf-token` (or `/api/v1/owner/csrf-token`) to start the realm session and get the token.
2. Send `X-CSRF-TOKEN: <csrf_token>` on every POST/PUT/PATCH/DELETE.
3. Login regenerates the session and rotates the CSRF token; use the new `csrf_token` returned in the login response.
4. The built-in `XSRF-TOKEN` cookie is not used.

### Error envelope

All API errors render JSON with a stable shape:

```json
{
  "message": "This action is unauthorized.",
  "status": 403
}
```

Validation errors add an `errors` object:

```json
{
  "message": "The given data was invalid.",
  "status": 422,
  "errors": {
    "email": ["The email field is required."]
  }
}
```

This covers `401`, `403`, `404`, `409`, `419`, and `422`, plus other HTTP errors.

### Tenant lifecycle

- Delete and restore are owner-only.
- Deleted tenants are soft-deleted and hidden from owner listings.
- `tenants.is_due` is a billing flag; it never schedules or triggers deletion.
- `php artisan tenants:purge` permanently removes tenants soft-deleted for more than 30 days, including their users, posts, profiles, invitations, support rows, sessions, and billing mirror rows.
- `php artisan schedule:list` shows the daily purge job.

```bash
php artisan tenants:purge
php artisan tenants:purge --days=30
```

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
pnpm install       # first time only
composer format    # PHP CS Fixer + Prettier
composer format:check
```

PHP CS Fixer formats PHP (`app/`, `bootstrap/`, `config/`, `database/`, `public/`, `routes/`, `tests/`, `artisan`); Prettier handles JSON, Markdown, YAML, and other supported files. Laravel Pint is not used.

## Type checking

```bash
composer type-check        # full PHPStan + Larastan report
composer type-check:files  # only files containing type errors
```

## Frontends

The owner dashboard, tenant dashboard, and user web are separate frontends. Local defaults are `http://localhost:3000`, `http://localhost:3001`, and `http://localhost:3002`. Tenant scope comes from the authenticated user's email and `tenant_id`, never from a slug. Viewers have no tenant and browse the tenant directory. The API returns `redirect_url` where the frontend should navigate; the full flow map is in [`docs/frontend-redirects.md`](docs/frontend-redirects.md).

The frontend workspace is a pnpm monorepo under `frontend/apps/`:

```text
owner        http://localhost:3000
tenant       http://localhost:3001
user         http://localhost:3002
visualizer   http://localhost:3003
```

Run from the repository root:

```bash
pnpm dev:owner
pnpm dev:tenant
pnpm dev:user
pnpm dev:visualizer
pnpm dev:frontend       # all four in parallel
pnpm typecheck:frontend
pnpm build:frontend
```

`pnpm dev` and `pnpm build` are aliases for the frontend workspace.

- Frontend URLs: `config/frontends.php` / `OWNER_FRONTEND_URL`, `TENANT_FRONTEND_URL`, `USER_FRONTEND_URL`
- CORS: `config/cors.php` / `CORS_ALLOWED_ORIGINS` (defaults to the three localhost origins and their `127.0.0.1` equivalents)
- Same-origin note: `SESSION_DOMAIN=null` works for both `localhost:8000` and `multi-tenant-plog.test`; with `composer dev`, point the frontends at `http://localhost:8000/api` or proxy `/api` through each frontend
- Viewer signup: `POST /api/v1/auth/register`
- Viewer directory: `GET /api/v1/tenants`, `GET /api/v1/tenants/{tenant}/posts`
- Support ticket TTL and session idle timeout: `config/support.php`

## System Atlas

Interactive dark-blueprint visualizer for the backend:

```text
http://localhost:3003
```

It includes:

- A clickable architecture map across frontends, middleware, controllers, services, models, databases, commands, Stripe, and docs.
- The full generated request catalog with search, method/realm/group filters, permissions, middleware, and controller files.
- A purpose catalog for every relevant file, with deep links from journeys and details.
- 16 playable journeys and cross-cutting systems with middleware, request classes, services, models, tables, DB operations, responses, error branches, and speaker notes.
- An ERD for the application and owner databases, a model explorer for all 13 models, and a table explorer with readers and writers.
- A command atlas for `owner:create`, `permissions:sync`, `tenants:purge`, `stripe:sync-plans`, and `stripe:sync-billing`, plus the daily purge schedule.
- Presenter mode with keyboard navigation, focus mode, deep links, and live switching between journeys, models, commands, and requests.

```bash
pnpm dev:visualizer
pnpm generate:requests
pnpm atlas:validate
pnpm build:visualizer     # writes frontend/apps/visualizer/dist
```

The visualizer build outputs `frontend/apps/visualizer/dist`. Laravel is API-only and does not serve the frontend; deploy the static build with a host that provides an SPA fallback if you need clean deep links. `pnpm build` builds every frontend, including the Atlas.

See `tasks.md` for the completed roadmap, `frontend/apps/visualizer/README.md` for the authoring guide and presentation flow, and [`docs/system-atlas-data.md`](docs/system-atlas-data.md) for the data/JSON generation reference.

## Billing

Stripe is fully backend-driven: the frontend sends `plan_id`, receives `checkout_url`, and redirects to Stripe-hosted Checkout. Stripe renders the payment form; webhooks keep the local subscription, invoice, and payment mirror in sync.

- Public API origin for Stripe return/webhook URLs: `PUBLIC_API_URL` (no `/api` suffix)
- Stripe config: `config/services.php` / `STRIPE_MODE`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_ALLOW_LIVE`
- Plans: `config/plans.php`, `PlanSeeder`, `php artisan stripe:sync-plans`
- Payment due flag: `tenants.is_due` (billing-only UI; never schedules deletion)
- Webhook: `POST /api/v1/stripe/webhook`
- Owner metrics: `GET /api/v1/owner/billing/metrics` (last 12 months by default, with `timeline` for Chart.js)
- Backfill: `php artisan stripe:sync-billing`
- Full guide: [`docs/billing.md`](docs/billing.md)

## IDE support

```bash
composer ide-helper
```

Generates `_ide_helper.php`, `_ide_helper_models.php`, and `.phpstorm.meta.php` for Laravel-aware autocompletion. The files are gitignored and should be regenerated after model or schema changes. VS Code Intelephense settings live in `.vscode/settings.json`; restart the language server after regenerating.

## CI

GitHub Actions runs on every push to `master`:

- `composer format:check`
- `composer type-check`
- `pnpm typecheck:frontend`
- `pnpm build:frontend`
- `php artisan test` against MariaDB
- Production build (`composer install --no-dev`, `php artisan config:cache`, boot checks)

The workflow is `.github/workflows/ci.yml`.

## Structure

- `routes/api.php` — all API routes
- `app/Http/Controllers` — controllers
- `app/Models` — Eloquent models
- `database/migrations` — schema
- `bootstrap/app.php` — routing/middleware/exception configuration
- `frontend/apps` — pnpm workspace: owner, tenant, user, and System Atlas
- `docs` — redirect and billing documentation
- `tasks.md` — System Atlas roadmap (gitignored)
- `commands.md` — command reference (gitignored)

All exceptions on `api/*` are rendered as JSON.
