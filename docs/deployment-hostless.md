# Deploy Laravel to Hostless (Docker + MySQL)

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
- MySQL extensions: `pdo_mysql`, `bcmath`, `intl`, `zip`, `opcache`
- Laravel scheduler via `php artisan schedule:work`

The entrypoint runs:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
php artisan migrate --force --database=owner --path=database/migrations/owner
```

It retries migrations while the database starts.

## 1. Create the MySQL databases

Preferred: two databases on the Hostless MySQL instance.

```text
multi_tenant_plog_app
multi_tenant_plog_owner
```

The app database holds tenants, users, posts, billing mirrors, sessions, and cache. The owner database holds the `owners` table.

If Hostless only allows one database, use the same database for both connections. There is no table collision for the current owner migration, which only creates `owners`.

## 2. Create the Hostless app

Use a **Docker** application.

| Setting           | Value                              |
| ----------------- | ---------------------------------- |
| Repository        | this repo                          |
| Dockerfile        | `Dockerfile`                       |
| Build context     | repository root                    |
| Internal port     | `8080` (or let `PORT` override it) |
| Health check      | `GET /up`                          |
| Persistent volume | not required                       |

No persistent volume is required because the app has no uploads. Logs go to stdout/stderr.

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

DB_CONNECTION=mysql
DB_HOST=HOSTLESS_MYSQL_HOST
DB_PORT=3306
DB_DATABASE=multi_tenant_plog_app
DB_USERNAME=HOSTLESS_MYSQL_USER
DB_PASSWORD=HOSTLESS_MYSQL_PASSWORD

OWNER_DB_CONNECTION=mysql
OWNER_DB_HOST=HOSTLESS_MYSQL_HOST
OWNER_DB_PORT=3306
OWNER_DB_DATABASE=multi_tenant_plog_owner
OWNER_DB_USERNAME=HOSTLESS_MYSQL_USER
OWNER_DB_PASSWORD=HOSTLESS_MYSQL_PASSWORD

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
SCRAMBLE_DEV_TOOLS=false

RUN_DEMO_SEED=false
```

Generate `APP_KEY` locally:

```bash
php artisan key:generate --show
```

Copy the `base64:...` value into Hostless. Do not generate it on every container start.

If Hostless provides a single database URL, you can use:

```env
DB_URL=mysql://user:password@host:3306/multi_tenant_plog_app
OWNER_DB_URL=mysql://user:password@host:3306/multi_tenant_plog_owner
```

Keep the explicit `DB_*` / `OWNER_DB_*` variables if Hostless gives separate fields.

## 4. Deploy

1. Push the repository.
2. Create the Hostless Docker app.
3. Add the MySQL connection values.
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

The container runs:

```bash
php artisan schedule:work
```

This executes `tenants:purge` and `tenants:mark-due` daily.

If Hostless provides cron jobs, you can remove the `[program:scheduler]` block from `docker/supervisord.conf` and add a one-minute cron:

```bash
php artisan schedule:run
```

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

Use `DOCS_USERNAME` / `DOCS_PASSWORD`.

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

| Problem               | Fix                                                        |
| --------------------- | ---------------------------------------------------------- |
| 502 from Nginx        | Set the internal port to `8080` or let `PORT` be injected. |
| Migrations fail       | Confirm MySQL is reachable and `OWNER_DB_*` is correct.    |
| 419 CSRF              | `SESSION_DOMAIN` and CORS origins are wrong.               |
| Cookies missing       | API must be HTTPS and `SESSION_SECURE_COOKIE=true`.        |
| Mixed content blocked | Use `https://api.ymdev.me`, not `http://`.                 |
| 500 after deploy      | Check `LOG_CHANNEL=stderr` output and `APP_KEY`.           |
| Stripe webhook 400    | `STRIPE_WEBHOOK_SECRET` does not match the endpoint.       |
| Scramble docs 503     | `DOCS_USERNAME` / `DOCS_PASSWORD` are missing.             |
