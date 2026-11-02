# Deploy Laravel to Hostless (Docker + PostgreSQL)

> API: `https://api.ymdev.me`
>
> Frontends: `https://owner.ymdev.me`, `https://tenant.ymdev.me`, `https://user.ymdev.me`

## Important: use HTTPS for the API

Use:

```text
https://api.ymdev.me
```

Do not use `http://api.ymdev.me` for production. The frontends are served over HTTPS, so browsers will block HTTP API calls as mixed content, and `Secure` session cookies cannot be set over HTTP.

If Hostless gives you automatic SSL, enable it on `api.ymdev.me` before deploying the frontends.

## What is already in the repo

```text
Dockerfile
.dockerignore
docker/entrypoint.sh
docker/nginx.conf.template
docker/supervisord.conf
```

The image contains:

- PHP 8.3 FPM
- Nginx on the `PORT` provided by Hostless (default `8080`)
- Supervisor
- Database extensions: `pdo_pgsql`, `pdo_mysql`, `bcmath`, `intl`, `zip`, `opcache`

The entrypoint runs:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
php artisan migrate --force --database=owner --path=database/migrations/owner
```

It retries migrations while the database starts.

## 1. Database

Create a managed **PostgreSQL 17** database in Hostless and link it to this app. The app and the database then run on the same platform, which keeps query latency low.

### One database, two schemas

Hostless gives you one database. The app does not use a second database for owner data; it keeps owner tables in a dedicated `owner` schema:

```text
public  → tenants, users, posts, sessions, cache, billing mirrors
owner   → owners, owner password resets, owner migrations
```

The app migration `2026_11_01_073632_create_owner_schema` creates the `owner` schema on the owner connection, so the entrypoint only needs:

```bash
php artisan migrate --force
php artisan migrate --force --database=owner --path=database/migrations/owner
```

Each migration set keeps its own `migrations` table (`public.migrations` and `owner.migrations`), so the two sets never collide.

### Hostless environment variables

Copy the values from the Hostless database page (**Databases → your database → Connection Information**) and keep TLS on:

```env
DB_CONNECTION=pgsql
DB_HOST=your-db.db.hostless.cloud
DB_PORT=5432
DB_DATABASE=your-db-name
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_SSLMODE=require
DB_SCHEMA=public

OWNER_DB_CONNECTION=pgsql
OWNER_DB_HOST=your-db.db.hostless.cloud
OWNER_DB_PORT=5432
OWNER_DB_DATABASE=your-db-name
OWNER_DB_USERNAME=your-db-user
OWNER_DB_PASSWORD=your-db-password
OWNER_DB_SCHEMA=owner
OWNER_DB_SSLMODE=require
```

Both connections point at the same database. Only `OWNER_DB_SCHEMA` differs.

Hostless PostgreSQL runs behind PgBouncer, so keep the connection count modest; the Laravel defaults are fine for a single container.

### Local development parity

Local development uses the same layout:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=multi_tenant_plog_app
DB_USERNAME=youssef
DB_PASSWORD=1234
DB_SSLMODE=prefer
DB_SCHEMA=public

OWNER_DB_CONNECTION=pgsql
OWNER_DB_HOST=127.0.0.1
OWNER_DB_PORT=5432
OWNER_DB_DATABASE=multi_tenant_plog_app
OWNER_DB_USERNAME=youssef
OWNER_DB_PASSWORD=1234
OWNER_DB_SCHEMA=owner
OWNER_DB_SSLMODE=prefer
```

The test suite uses separate databases (`multi_tenant_plog_app_test` and `multi_tenant_plog_owner_test`) with the default `public` schema, so tests never touch development data.

## 2. Create the Hostless app

Use a **Docker** application.

| Setting                 | Value                            |
| ----------------------- | -------------------------------- |
| Build system            | Docker                           |
| Repository              | this repo                        |
| Working Directory       | `/`                              |
| Build Context Directory | `/`                              |
| Dockerfile Path         | `Dockerfile`                     |
| Internal port           | Hostless `PORT` (default `8080`) |
| Health check            | HTTP `GET /up`                   |
| Persistent volume       | not required                     |

Hostless sets `PORT` and expects the process to bind `0.0.0.0`. The Nginx template listens on `0.0.0.0:${PORT}`.

The root filesystem is read-only at runtime and the container runs as a non-root user, so nothing in the entrypoint writes to the image. Laravel runtime caches go to `/tmp`:

```text
APP_CONFIG_CACHE=/tmp/laravel/cache/config.php
APP_ROUTES_CACHE=/tmp/laravel/cache/routes-v7.php
APP_EVENTS_CACHE=/tmp/laravel/cache/events.php
APP_PACKAGES_CACHE=/tmp/laravel/cache/packages.php
APP_SERVICES_CACHE=/tmp/laravel/cache/services.php
VIEW_COMPILED_PATH=/tmp/laravel/views
LOG_CHANNEL=stderr
```

Nginx follows the same rule: the entrypoint renders the virtual host into `/tmp/nginx/conf.d/default.conf`, and `/etc/nginx/nginx-main.conf` keeps its pid and temp paths under `/tmp/nginx`. The entrypoint never calls `chown`; it creates the `/tmp` directories it owns and makes them world-writable instead.

Hostless runs the container as root **without** `CAP_SETUID`, `CAP_SETGID`, or `CAP_CHOWN`, so the image does not drop privileges:

- `docker/php-fpm.conf` overrides the pool to `user = root` / `group = root`, and Supervisor starts FPM with `php-fpm -F -R`. Without this, FPM workers die with `failed to setgid(33): Operation not permitted`.
- `docker/nginx-main.conf` runs Nginx with `master_process off` and `user root`, which avoids worker `setuid`/`initgroups` calls that also need those capabilities.

No persistent volume is required because the app has no uploads. Logs go to stdout/stderr.

If Hostless reports write failures under `storage`, attach a volume at `/var/www/html/storage` and keep the `/tmp` cache paths above.

Add the domain:

```text
api.ymdev.me
```

Enable SSL / Let's Encrypt in Hostless.

## 3. Environment variables

Set these in Hostless. Replace the database and Stripe values with the real ones.

```env
APP_NAME="Multi Tenant Plog"
APP_ENV=production
APP_KEY=base64:GENERATE_THIS
APP_DEBUG=false
APP_URL=https://api.ymdev.me
PUBLIC_API_URL=https://api.ymdev.me

LOG_CHANNEL=stderr
LOG_LEVEL=info

DB_CONNECTION=pgsql
DB_HOST=HOSTLESS_DB_HOST
DB_PORT=5432
DB_DATABASE=HOSTLESS_DB_NAME
DB_USERNAME=HOSTLESS_DB_USER
DB_PASSWORD=HOSTLESS_DB_PASSWORD
DB_SSLMODE=require
DB_SCHEMA=public

OWNER_DB_CONNECTION=pgsql
OWNER_DB_HOST=HOSTLESS_DB_HOST
OWNER_DB_PORT=5432
OWNER_DB_DATABASE=HOSTLESS_DB_NAME
OWNER_DB_USERNAME=HOSTLESS_DB_USER
OWNER_DB_PASSWORD=HOSTLESS_DB_PASSWORD
OWNER_DB_SCHEMA=owner
OWNER_DB_SSLMODE=require

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_COOKIE=tenant_session
SESSION_DOMAIN=.ymdev.me
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_ENCRYPT=false

OWNER_SESSION_COOKIE=owner_session
OWNER_SESSION_LIFETIME=120

CACHE_STORE=database
QUEUE_CONNECTION=sync

OWNER_FRONTEND_URL=https://owner.ymdev.me
TENANT_FRONTEND_URL=https://tenant.ymdev.me
USER_FRONTEND_URL=https://user.ymdev.me

TENANT_SUPPORT_PATH=/support/accept
TENANT_ACCEPT_INVITATION_PATH=/accept-invitation
TENANT_BILLING_PATH=/billing

CORS_ALLOWED_ORIGINS=https://owner.ymdev.me,https://tenant.ymdev.me,https://user.ymdev.me
CORS_ALLOWED_ORIGIN_PATTERNS=

MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=re_your_resend_key
MAIL_FROM_ADDRESS=no-reply@send.ymdev.me
MAIL_FROM_NAME="${APP_NAME}"

STRIPE_MODE=live
STRIPE_ALLOW_LIVE=false
STRIPE_KEY=pk_live_...
STRIPE_SECRET=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2026-09-30.endive

STRIPE_PLAN_1_NAME=Starter
STRIPE_PLAN_1_SLUG=plan-1
STRIPE_PLAN_1_PRODUCT_ID=prod_...
STRIPE_PLAN_1_PRICE_ID=price_...
STRIPE_PLAN_1_AMOUNT=5000
STRIPE_PLAN_1_CURRENCY=usd
STRIPE_PLAN_1_INTERVAL=month

STRIPE_PLAN_2_NAME=Growth
STRIPE_PLAN_2_SLUG=plan-2
STRIPE_PLAN_2_PRODUCT_ID=prod_...
STRIPE_PLAN_2_PRICE_ID=price_...
STRIPE_PLAN_2_AMOUNT=20000
STRIPE_PLAN_2_CURRENCY=usd
STRIPE_PLAN_2_INTERVAL=month

BILLING_CURRENCY=usd
BILLING_TRIAL_DAYS=14

DOCS_USERNAME=docs
DOCS_PASSWORD=CHANGE_THIS
DOCS_PUBLIC=true
SCRAMBLE_DEV_TOOLS=false

RUN_DEMO_SEED=false
```

Generate `APP_KEY` locally:

```bash
php artisan key:generate --show
```

Copy the `base64:...` value into Hostless. Do not generate it on every container start.

If Hostless gives you the full connection string, you can use it instead of the separate fields:

```env
DB_URL=postgresql://user:password@host:5432/database?sslmode=require
OWNER_DB_URL=postgresql://user:password@host:5432/database?sslmode=require
OWNER_DB_SCHEMA=owner
```

Keep the explicit `DB_*` / `OWNER_DB_*` variables if Hostless gives separate fields. `OWNER_DB_SCHEMA` is always required so owner tables stay out of `public`.

## 4. Deploy

1. Push the repository.
2. Create the Hostless Docker app.
3. Create the Hostless PostgreSQL database and copy its connection values.
4. Add the environment variables.
5. Add `api.ymdev.me` and enable SSL.
6. Deploy.

The entrypoint will run migrations automatically.

## 5. First production boot

The migrations run automatically. Then create the real owner and plans.

Create the owner:

```bash
php artisan owner:create \
  --name="Your Name" \
  --email="you@ymdev.me" \
  --password="a-strong-password"
```

Seed the plans:

```bash
php artisan db:seed --class=PlanSeeder --force
```

Without plans, billing has nothing to sell. Without an owner, nobody can sign in to `owner.ymdev.me`.

### Optional demo dataset

The project includes the full demo dataset:

```text
4 active tenants + 1 deleted + 1 purge audit
17 users
138 posts
6 permission profiles
5 subscriptions
30 invoices + 30 payments
3 invitations
2 support audit rows
```

For a showcase deployment, run once:

```bash
php artisan db:seed --class=DemoSeeder --force
```

On Hostless PostgreSQL this takes a few seconds. Run it from the Hostless terminal or a one-off cron job rather than with `RUN_DEMO_SEED=true` on every boot.

Use the Hostless console/exec feature.

Alternatively set:

```env
RUN_DEMO_SEED=true
```

for the first deploy, then set it back to `false`. Do not leave it enabled: the seeder replaces demo posts and billing rows.

Demo logins:

```text
owner@demo.test   / password
admin@demo.test   / password
viewer@demo.test  / password
```

Change these if the demo is public.

## 6. Stripe webhook

Create the endpoint:

```text
https://api.ymdev.me/api/v1/stripe/webhook
```

Enable these events:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.created
invoice.finalized
invoice.voided
invoice.paid
invoice.payment_failed
payment_intent.succeeded
payment_intent.payment_failed
charge.succeeded
charge.failed
charge.refunded
charge.dispute.created
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Checkout redirects use `PUBLIC_API_URL`, so keep it:

```text
https://api.ymdev.me
```

## 7. Frontend environment

Update each Vercel project:

```env
VITE_API_URL=https://api.ymdev.me/api
VITE_API_VERSION=v1
```

Redeploy the frontends after changing the API URL.

## 8. Scheduler

The app schedules two daily commands in `routes/console.php`:

```text
tenants:mark-due   0 0 * * *   (UTC)
tenants:purge      0 0 * * *   (UTC)
```

Create one Hostless **embedded cron job** for the app that runs Laravel's scheduler:

| Field     | Value                                    |
| --------- | ---------------------------------------- |
| Name      | `scheduler`                              |
| Command   | `php /var/www/html/artisan schedule:run` |
| Schedule  | `* * * * *`                              |
| Timezone  | UTC (offset `0`)                         |
| Resources | smallest that runs the command           |

Use the absolute artisan path so the command works regardless of the container working directory. The image entrypoint passes the command straight through, so an embedded job never starts nginx or Supervisor.

If you prefer one job per command and no every-minute runs, create two direct cron jobs instead:

```text
php /var/www/html/artisan tenants:mark-due   0 0 * * *
php /var/www/html/artisan tenants:purge     15 0 * * *
```

The container does not run a scheduler process; Hostless owns the schedule.

## 9. Queue

The app sends invitation mail synchronously, so:

```env
QUEUE_CONNECTION=sync
```

No queue worker is required.

If you later switch to database queues, add a worker:

```bash
php artisan queue:work --sleep=3 --tries=3
```

## 10. Verify

```bash
curl https://api.ymdev.me/api/v1/health
curl https://api.ymdev.me/up
```

Docs:

```text
https://api.ymdev.me/docs/api
```

Set `DOCS_PUBLIC=true` to let reviewers read the documentation without the shared credentials. Only `GET`/`HEAD` requests are allowed in public mode; every application endpoint keeps its own authentication. With `DOCS_PUBLIC=false`, the docs fall back to HTTP Basic auth using `DOCS_USERNAME` / `DOCS_PASSWORD`.

CORS check from the frontend:

1. Open `https://owner.ymdev.me`.
2. Sign in.
3. Confirm requests to `https://api.ymdev.me/api/v1/...` succeed and cookies are sent.

If login succeeds but requests return 419, check:

- `SESSION_DOMAIN=.ymdev.me`
- `SESSION_SECURE_COOKIE=true`
- `CORS_ALLOWED_ORIGINS`
- `APP_URL=https://api.ymdev.me`

## 11. Common Hostless pitfalls

| Problem                          | Fix                                                          |
| -------------------------------- | ------------------------------------------------------------ |
| 502 from Nginx                   | Set the internal port to `8080` or let `PORT` be injected.   |
| App does not start               | Nginx must bind `0.0.0.0:$PORT`; do not hardcode a port.     |
| `chown: Operation not permitted` | Root without `CAP_CHOWN`; never `chown` at runtime.          |
| `failed to setgid(33)`           | No `CAP_SETGID`; run the FPM pool as root with `php-fpm -R`. |
| `Read-only file system`          | Put runtime state in `/tmp` (caches, nginx config, pid).     |
| Migrations fail                  | Confirm PostgreSQL is reachable and `OWNER_DB_*` is correct. |
| 419 CSRF                         | `SESSION_DOMAIN` and CORS origins are wrong.                 |
| Cookies missing                  | API must be HTTPS and `SESSION_SECURE_COOKIE=true`.          |
| Write errors                     | Keep the `/tmp` cache paths or mount a volume at `storage`.  |
| Mixed content blocked            | Use `https://api.ymdev.me`, not `http://`.                   |
| 500 after deploy                 | Check `LOG_CHANNEL=stderr` output and `APP_KEY`.             |
| Stripe webhook 400               | `STRIPE_WEBHOOK_SECRET` does not match the endpoint.         |
| Scramble docs 503                | `DOCS_USERNAME` / `DOCS_PASSWORD` are missing.               |
