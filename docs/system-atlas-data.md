# System Atlas Data Pipeline

Reference for generating, authoring, and validating every dataset the visualizer uses.

- **App:** `frontend/apps/visualizer`
- **Dev URL:** `http://localhost:3003`
- **Authoring guide:** [`../frontend/apps/visualizer/README.md`](../frontend/apps/visualizer/README.md)

## Data flow

```text
Laravel routes
  └─ php artisan route:list --json --except-vendor
       └─ scripts/generate-requests.mjs
            └─ src/data/generated/requests.generated.json   (gitignored)

Hand-authored sources
  ├─ src/data/files.json          file catalog + purpose
  ├─ src/data/journeys.ts         journeys, systems, steps, DB impact
  ├─ src/data/models.ts           models, tables, columns, ERD edges
  └─ src/data/commands.ts         commands, writes, schedules

  └─ src/data/index.ts            typed exports + lookup maps
       └─ src/app/**/page.tsx     app-router pages
            └─ scripts/validate-atlas.mjs
```

`pnpm atlas:validate` regenerates the request catalog first, then checks every reference across the four hand-authored sources and the generated requests.

## Commands

Run from the repository root:

```bash
pnpm generate:requests     # regenerate the request JSON only
pnpm atlas:validate        # regenerate + validate all references
pnpm dev:visualizer        # dev server on :3003
pnpm build:visualizer      # static build in frontend/apps/visualizer/dist
pnpm typecheck:frontend    # tsgo typecheck for all apps
```

The visualizer package runs request generation automatically on `predev`, `pretypecheck`, `prebuild`, and `prevalidate`, so a normal dev or build never uses a stale route list.

## Generated request JSON

**Generator:** `frontend/apps/visualizer/scripts/generate-requests.mjs`

It runs:

```bash
php artisan route:list --json --except-vendor
```

and keeps only routes whose URI starts with `api/`. Output path:

```text
frontend/apps/visualizer/src/data/generated/requests.generated.json
```

The file is gitignored and must never be edited by hand. Shape:

```json
{
  "generatedAt": "2026-10-29T13:25:52.912Z",
  "source": "php artisan route:list --json --except-vendor",
  "count": 60,
  "requests": [
    {
      "method": "POST",
      "uri": "api/v1/posts",
      "path": "/api/v1/posts",
      "name": "api.v1.posts.store",
      "action": "App\\Http\\Controllers\\Api\\Tenant\\PostController@store",
      "controller": "PostController",
      "controllerFile": "app/Http/Controllers/Api/Tenant/PostController.php",
      "group": "Post",
      "realm": "tenant",
      "permissions": ["posts.create"],
      "middleware": [
        "api",
        "web",
        "auth:web",
        "support",
        "tenant.active",
        "permission:posts.create"
      ]
    }
  ]
}
```

Fields:

| Field            | Meaning                                               |
| ---------------- | ----------------------------------------------------- |
| `method`         | First HTTP verb reported by Laravel                   |
| `path`           | Absolute API path used by journeys and deep links     |
| `name`           | Laravel route name                                    |
| `action`         | Controller class and method, or `Closure`             |
| `controllerFile` | File path relative to the repository root             |
| `group`          | UI grouping derived from the controller namespace     |
| `realm`          | `public`, `owner`, or `tenant`, derived from the path |
| `permissions`    | Permissions parsed from `permission:` middleware      |
| `middleware`     | Full middleware list from `route:list`                |

Closure routes such as `/api/v1/health` map to `routes/api.php` so the file catalog stays valid.

## Hand-authored JSON: `files.json`

**Path:** `frontend/apps/visualizer/src/data/files.json`

Every path must exist on disk and have a purpose. Shape:

```json
{
  "path": "app/Services/PermissionSyncService.php",
  "layer": "service",
  "purpose": "Materializes role + profile + extra permissions into users.permissions.",
  "features": ["permissions"]
}
```

Allowed `layer` values: `client`, `routing`, `middleware`, `controller`, `request`, `service`, `model`, `database`, `resource`, `command`, `config`, `test`.

Rules:

- Paths are relative to the repository root.
- No duplicate paths.
- Only files involved in journeys, requests, models, commands, or cross-cutting systems.
- Every controller referenced by the generated request catalog must be present.

## Hand-authored TypeScript datasets

These are TypeScript modules, not JSON, so they can use shared types. The validator reads the exported arrays without compiling them.

### Journeys — `src/data/journeys.ts`

```ts
{
  id: 'tenant-provisioning',
  kind: 'journey',                 // 'journey' | 'system'
  title: 'Owner creates a tenant',
  subtitle: 'Tenant + first admin + hashed invitation in one transaction.',
  feature: 'Tenant provisioning',
  realm: 'owner',
  tone: 'amber',
  actors: ['Owner'],
  preconditions: ['Owner is authenticated.'],
  outcome: 'Tenant, admin, and invitation exist.',
  files: ['app/Services/TenantProvisioningService.php'],
  steps: [
    {
      id: 'transaction',
      title: 'Provision inside a transaction',
      summary: '...',
      actor: 'TenantProvisioningService',
      request: { method: 'POST', path: '/api/v1/owner/tenants' },
      requestClass: 'App\\Http\\Requests\\Owner\\StoreTenantRequest',
      middleware: ['web', 'auth:owner'],
      controller: 'TenantController@store',
      service: 'TenantProvisioningService::provision',
      models: ['Tenant', 'User', 'TenantInvitation'],
      tables: [
        { table: 'tenants', operation: 'insert', detail: 'owner_id, name, category.' }
      ],
      response: '201 TenantResource',
      errors: ['422 duplicate admin email'],
      files: ['app/Services/TenantProvisioningService.php'],
      speakerNotes: 'The raw token never reaches the database.'
    }
  ]
}
```

Rules:

- `id` is unique across all journeys and steps.
- `request.method + ' ' + request.path` must exist in the generated catalog.
- `models` must exist in `models.ts`.
- `tables` must exist in `models.ts` or `systemTables`.
- `files` must be catalogued in `files.json`.
- `operation` is `read`, `insert`, `update`, `delete`, or `upsert`.

### Models and tables — `src/data/models.ts`

```ts
{
  name: 'Post',
  table: 'posts',
  connection: 'app',               // 'app' | 'owner'
  file: 'app/Models/Post.php',
  purpose: 'Tenant-scoped article.',
  softDeletes: true,
  scopes: ['TenantScope', 'visibleTo'],
  columns: [{ name: 'tenant_id', type: 'bigint unsigned' }],
  relations: [{ type: 'belongsTo', model: 'Tenant', foreignKey: 'tenant_id' }],
  readers: ['Post index/show'],
  writers: ['Post create/update']
}
```

`systemTables` uses the same column/index shape for tables without a model, such as `sessions`, `password_reset_tokens`, and `cache`.

ERD edges are derived automatically from `relations`. Relation targets must exist in the model list.

### Commands — `src/data/commands.ts`

```ts
{
  name: 'tenants:purge',
  signature: 'php artisan tenants:purge {--days=30}',
  file: 'app/Console/Commands/PurgeTenantsCommand.php',
  purpose: 'Permanently remove tenants deleted beyond retention.',
  tone: 'red',
  options: [{ flag: '--days', description: 'Retention window.' }],
  reads: ['tenants (onlyTrashed)'],
  writes: [{ table: 'tenants', operation: 'delete', detail: 'Force delete.' }],
  external: [],
  schedule: 'Daily via routes/console.php',
  idempotent: true,
  output: ['Purged {count} tenant(s).'],
  notes: 'is_due never starts the retention clock.'
}
```

Every `writes[].table` must exist in the table catalog.

## Validation contract

`pnpm atlas:validate` fails when:

- A catalogued file is duplicated or missing.
- A request controller file is not catalogued.
- A journey step references an unknown request, model, table, or file.
- A journey or step id is duplicated.
- A model relates to an unknown model or has an unknown table.
- A command writes to an unknown table.

Successful output:

```text
Atlas OK: 60 requests, 131 files, 16 journeys, 13 models, 5 commands, all references valid.
```

## Adding or changing data

1. Change Laravel routes or controllers.
2. Run `pnpm generate:requests`.
3. Update `files.json` for any new backend file.
4. Update journeys, models, or commands for the new behavior.
5. Run `pnpm atlas:validate`.
6. Run `pnpm typecheck:frontend`.
7. Run `pnpm build:visualizer` if you need the static build.

When adding a new page to the Atlas, follow the app-router convention:

```text
src/app/(atlas)/<segment>/page.tsx        route inside the sidebar shell
src/app/present/[[...slug]]/page.tsx      presenter route outside the shell
src/routes.tsx                            map the page to a React Router path
```

## Static build

`pnpm build:visualizer` writes:

```text
frontend/apps/visualizer/dist/
  index.html
  assets/*.js
  assets/*.css
```

The build uses browser routing, so the host must provide an SPA fallback (serve `index.html` for unknown paths) to keep deep links working. Laravel is API-only and does not serve the frontend. The directory is gitignored and regenerated on every build.

## CI and hooks

- `frontend/apps/visualizer/package.json` runs generation before dev, typecheck, build, and validate.
- Root `pnpm build` builds all four frontends, including the static Atlas.
- `pnpm atlas:validate` is safe to run locally and in CI; it needs PHP and the Laravel app bootstrapped.
