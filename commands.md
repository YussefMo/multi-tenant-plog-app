# Command Reference

All commands are run from the project root:

```bash
cd ~/projects/multi-tenant-plog-app
```

## First-time setup

```bash
composer install                 # Install PHP dependencies
cp .env.example .env             # Create local environment file
php artisan key:generate         # Generate APP_KEY
pnpm install                     # Install Prettier and frontend workspace dependencies
php artisan migrate              # Build the application database
```

Create the owner database and run its migrations:

```bash
php artisan migrate --database=owner --path=database/migrations/owner
```

Create the first owner:

```bash
php artisan owner:create --name="Owner" --email="owner@example.com" --password="password123"
```

Seed plans:

```bash
php artisan db:seed --class=PlanSeeder
```

## Daily development

```bash
composer dev                     # Start the API on http://localhost:8000
php artisan serve --host=127.0.0.1 --port=8000
php artisan serve --host=0.0.0.0 --port=8000
```

Useful URLs:

```text
API root        http://localhost:8000/
Health          http://localhost:8000/api/v1/health
Framework up    http://localhost:8000/up
API docs        http://localhost:8000/docs/api
OpenAPI JSON    http://localhost:8000/docs/api.json
```

`/docs/api` is HTTP Basic protected. Use `DOCS_USERNAME` and `DOCS_PASSWORD` from `.env`.

## Environment and configuration

```bash
php artisan config:clear         # Remove cached config after changing .env
php artisan config:cache         # Cache config for faster production boot
php artisan config:show          # Show all resolved config
php artisan config:show frontends
php artisan config:show cors
php artisan config:show session
```

Clear other Laravel caches:

```bash
php artisan cache:clear          # Application cache
php artisan route:clear          # Compiled route cache
php artisan view:clear           # Compiled Blade views
php artisan optimize:clear       # Clear config, route, view, and event caches
```

After changing `.env`:

```bash
php artisan config:clear
```

Restart `composer dev` if the server does not pick up the change automatically.

## Routes

```bash
php artisan route:list                               # All routes
php artisan route:list --except-vendor               # App routes only
php artisan route:list --path=api/v1                 # API v1 routes
php artisan route:list --path=api/v1 --except-vendor
php artisan route:list --method=GET --except-vendor
php artisan route:list --name=owner                  # Filter by route name
php artisan route:list --path=docs                   # Docs routes
```

## Database

```bash
php artisan migrate                    # Run pending app migrations
php artisan migrate:status             # Show migration status
php artisan migrate:fresh              # Drop all app tables and migrate
php artisan migrate:fresh --seed       # Reset and seed default data
php artisan db:wipe                    # Drop all app tables only
php artisan db:seed                    # Run DatabaseSeeder (plans)
```

Owner database:

```bash
php artisan migrate --database=owner --path=database/migrations/owner
php artisan migrate:fresh --database=owner --path=database/migrations/owner
php artisan migrate:status --database=owner
```

Inspect tables:

```bash
php artisan db:table tenants
php artisan db:table users
php artisan db:table tenant_invitations
php artisan db:table billing_payments
```

## Seeders and demo data

```bash
php artisan db:seed --class=PlanSeeder
php artisan db:seed --class=DemoSeeder
```

`DemoSeeder` creates:

- 2 tenants
- 100 large randomized posts
- admin and author users per tenant
- one global viewer
- support users
- permission profiles
- subscriptions
- 12 months of invoices and payments
- chart-ready billing metrics

Running `DemoSeeder` again replaces demo-tenant posts and refreshes the demo billing mirror.

Demo logins:

```text
Owner            owner@example.com    / password123
Tenant 1 admin   admin@demo.test      / password
Tenant 1 author  author@demo.test     / password
Tenant 2 admin   admin2@demo.test     / password
Tenant 2 author  author2@demo.test    / password
Viewer           viewer@demo.test     / password
```

## Owner and tenant management

```bash
php artisan owner:create
php artisan owner:create --name="Owner" --email="owner@example.com" --password="password123"
```

## Permissions

```bash
php artisan permissions:sync                    # Recompute all users
php artisan permissions:sync --tenant=1         # One tenant
php artisan permissions:sync --user=42          # One user
```

This repairs drift in the materialized `users.permissions` field.

## Tenant lifecycle

```bash
php artisan tenants:purge                       # Purge tenants deleted > 30 days
php artisan tenants:purge --days=30
php artisan tenants:purge --days=0              # Purge all soft-deleted tenants
```

Scheduled purge:

```bash
php artisan schedule:list
php artisan schedule:run
```

The purge command is scheduled daily at midnight.

## Stripe and billing

```bash
php artisan stripe:sync-plans
php artisan stripe:sync-billing
php artisan stripe:sync-billing --tenant=1
php artisan stripe:sync-billing --tenant=1 --since=2026-01-01
php artisan stripe:sync-billing --since=1700000000
```

- `stripe:sync-plans` creates/retrieves Stripe products and prices from `config/plans.php`.
- `stripe:sync-billing` backfills subscriptions, invoices, and payments from Stripe.

Stripe CLI webhook forwarding:

```bash
stripe listen --forward-to http://localhost:8000/api/v1/stripe/webhook
stripe listen --forward-to http://multi-tenant-plog.test/api/v1/stripe/webhook
```

## Frontend workspace

The pnpm workspace root is `frontend/`. Root scripts are thin delegates.

```bash
pnpm install:frontend           # Install frontend dependencies
pnpm dev                         # All four apps
pnpm build                       # Build all four apps
pnpm dev:owner                   # Owner app on http://localhost:3000
pnpm dev:tenant                  # Tenant app on http://localhost:3001
pnpm dev:user                    # User web on http://localhost:3002
pnpm dev:visualizer              # System Atlas on http://localhost:3003
pnpm build:visualizer            # Static Atlas build in frontend/apps/visualizer/dist
pnpm dev:frontend                # All four apps in parallel
pnpm typecheck                   # tsgo for apps + shared
pnpm test                        # Vitest + happy-dom
pnpm test:coverage               # Vitest coverage
pnpm build:frontend              # Production build for all apps
pnpm generate:requests           # Regenerate the Atlas request catalog
pnpm atlas:validate              # Validate requests, journeys, models, commands, files
```

`frontend/shared` contains shadcn UI, the axios/CSRF client, cookies, toast helpers, theme, and the TanStack Query provider. `frontend/apps/visualizer` is the System Atlas. The owner, tenant, and user apps are Phase 1 placeholders. Laravel is API-only; the frontend apps run on their own Vite servers.

If pnpm reports `no @pnpm/exe.linux-x64 native binary was found for this host`, install a native Linux pnpm and keep package-manager version management disabled:

```bash
rm -f ~/.local/bin/pnpm ~/.local/bin/pnpx
npm install -g pnpm@12.15.0 --prefix ~/.local --force
hash -r
which pnpm
pnpm -v
```

`which pnpm` should point to a Linux path such as `/home/youssef/.local/bin/pnpm` or `/home/youssef/.local/share/pnpm/bin/pnpm`, not `/mnt/c/...`.

## API documentation

```bash
php artisan scramble:analyze        # Analyze docs generation for missing schemas
php artisan scramble:export         # Export OpenAPI JSON to api.json (gitignored)
php artisan scramble:cache          # Cache generated OpenAPI document
php artisan scramble:clear          # Clear docs cache
```

Open:

```text
http://localhost:8000/docs/api
http://localhost:8000/docs/api.json
```

Curl with Basic auth:

```bash
curl -u "$DOCS_USERNAME:$DOCS_PASSWORD" http://localhost:8000/docs/api.json
```

## Logs and debugging

Application log:

```text
storage/logs/laravel.log
```

Watch logs live:

```bash
php artisan pail
tail -f storage/logs/laravel.log
```

Filter logs:

```bash
php artisan pail --filter=invitation
grep -n 'Invitation' storage/logs/laravel.log | tail -20
grep -n 'test@example.com' storage/logs/laravel.log
grep -n 'Accept invitation:' storage/logs/laravel.log | tail -5
grep -n 'ERROR' storage/logs/laravel.log | tail -20
```

Show a section of the log:

```bash
sed -n '225,260p' storage/logs/laravel.log
```

Invitation tokens are only in the email log or the local/testing tenant-creation response. The database stores only `token_hash`.

## Tinker

```bash
php artisan tinker
```

Examples inside tinker:

```php
App\Models\Tenant::all();
App\Models\User::where("email", "admin@demo.test")->first();
App\Models\TenantInvitation::latest()->first();
```

## Testing

```bash
php artisan test --compact
php artisan test --compact tests/Feature/TenantAuthTest.php
php artisan test --compact --filter=test_owner_can_create_tenant
vendor/bin/phpunit
vendor/bin/phpunit tests/Feature/TenantAuthTest.php
```

Tests use the databases configured in `phpunit.xml`.

## Code quality

```bash
composer format                  # PHP CS Fixer + Prettier
composer format:check            # Verify formatting
composer type-check              # Full PHPStan + Larastan
composer type-check:files        # Only files with type errors
composer ide-helper              # Regenerate IDE helper files
```

JavaScript/Markdown formatting:

```bash
pnpm format
pnpm format:check
```

## Composer

```bash
composer install
composer install --no-dev --prefer-dist --optimize-autoloader
composer dump-autoload
composer audit
```

## Queue and scheduler

```bash
php artisan queue:work
php artisan queue:listen
php artisan queue:clear
```

Scheduler:

```bash
php artisan schedule:list
php artisan schedule:run
php artisan schedule:work
```

## Useful curl flows

### Tenant login

```bash
COOKIE=/tmp/tenant.cookies
rm -f "$COOKIE"

CSRF=$(curl -s -c "$COOKIE" http://localhost:8000/api/v1/csrf-token \
  | php -r 'echo json_decode(stream_get_contents(STDIN), true)["csrf_token"];')

curl -i -b "$COOKIE" -c "$COOKIE" \
  -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-TOKEN: $CSRF" \
  --data '{"email":"admin@demo.test","password":"password"}'
```

### Owner login

```bash
COOKIE=/tmp/owner.cookies
rm -f "$COOKIE"

CSRF=$(curl -s -c "$COOKIE" http://localhost:8000/api/v1/owner/csrf-token \
  | php -r 'echo json_decode(stream_get_contents(STDIN), true)["csrf_token"];')

curl -i -b "$COOKIE" -c "$COOKIE" \
  -X POST http://localhost:8000/api/v1/owner/auth/login \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-TOKEN: $CSRF" \
  --data '{"email":"owner@example.com","password":"password123"}'
```

### Accept invitation

```bash
curl -i -X POST http://localhost:8000/api/v1/auth/accept-invitation \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-TOKEN: <tenant-csrf-token>" \
  --data '{
    "email": "admin@example.com",
    "token": "<raw-token-from-email>",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

Always use a cookie jar (`-c` to save, `-b` to send) with login and authenticated API requests.

## Quick troubleshooting

### 419 CSRF mismatch

- Call `/api/v1/csrf-token` or `/api/v1/owner/csrf-token` first.
- Reuse the same cookie jar.
- Use the new `csrf_token` returned after login.
- Do not mix tenant and owner CSRF tokens.

### 401 after login

- Check that `SESSION_DOMAIN=null` for localhost development.
- Call the same host you logged in to.
- Do not mix `localhost` and `127.0.0.1`.
- Send cookies with `-b cookies.txt` or `credentials: 'include'`.
- Run `php artisan config:clear` after `.env` changes.

### Tenant owner routes return 401

- Use the owner CSRF endpoint.
- Use the owner login endpoint.
- Reuse the owner cookie jar.
- Check `SESSION_DOMAIN`.

### Invitation says invalid or expired

- Use the raw token from the email or `invitation.token` response.
- The `token_hash` column will not work.
- Check that the invitation is not expired or already accepted.

### 403 from docs

- Docs use HTTP Basic auth.
- Set `DOCS_USERNAME` and `DOCS_PASSWORD`.
- Run `php artisan config:clear`.

### CORS errors

```bash
php artisan config:show cors
```

Allowed origins are configured in `CORS_ALLOWED_ORIGINS`.

### Changes to `.env` not applied

```bash
php artisan config:clear
```

Then restart `composer dev`.

## Git

```bash
git status
git diff
git diff --cached
git log --oneline -5
```

Do not commit `.env`, `api.json`, or generated IDE helper files.
