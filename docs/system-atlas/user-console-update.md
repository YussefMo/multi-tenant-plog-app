# System Atlas — User Console Update Plan

> **Status:** planned, not executed.
>
> This covers the viewer backend gaps and the user client (port `3002`).
>
> Related: [`tenant-console-update.md`](./tenant-console-update.md), [`tenant-owner-protection-update.md`](./tenant-owner-protection-update.md), and [`mail-resend-invitations-update.md`](./mail-resend-invitations-update.md).

## 1. What is automatic vs manual

| Atlas surface    | Source                                          | Picks up the viewer changes automatically?                               |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| `/requests`      | `php artisan route:list --json --except-vendor` | **Yes.** Regenerated on predev, pretypecheck, prebuild, and prevalidate. |
| `/files`         | `src/data/files.json`                           | **No.** Static catalog.                                                  |
| `/models`        | `src/data/models.ts`                            | **No.** Static catalog.                                                  |
| `/journeys`      | `src/data/journeys.ts`                          | **No.** Static catalog.                                                  |
| `/commands`      | `src/data/commands.ts`                          | **No.** No command changed.                                              |
| Architecture map | `src/data/architecture.ts`                      | **No.** Static catalog.                                                  |

Generated catalog after the viewer backend changes:

```text
72 API operations · 56 unique paths
13 models
6 commands
```

New routes:

```text
GET /api/v1/tenants/{tenant}      viewer tenant profile
GET /api/v1/viewer/overview       viewer discover overview
```

Existing routes gained filters:

```text
GET /api/v1/tenants               search, name, category, per_page, page
GET /api/v1/tenants/{tenant}/posts  search, per_page, page
```

`PostResource` now includes:

```json
{
  "tenant": { "id": 1, "name": "Acme" }
}
```

## 2. File catalog additions

Add these entries to `frontend/apps/visualizer/src/data/files.json`.

Backend:

```json
{
  "path": "app/Http/Controllers/Api/Tenant/ViewerOverviewController.php",
  "layer": "controller",
  "purpose": "Returns viewer directory counts, categories, recent tenants, and recent published posts for the Discover dashboard.",
  "features": ["viewer-directory", "user-console"]
},
{
  "path": "tests/Feature/ViewerOverviewTest.php",
  "layer": "test",
  "purpose": "Covers viewer overview counts, categories, recent tenants, recent published posts, and non-viewer guards.",
  "features": ["viewer-directory", "tests"]
}
```

User client (add when the client is represented in the Atlas):

```json
{
  "path": "frontend/apps/user/src/routes.tsx",
  "layer": "client",
  "purpose": "User client route table: login, register, discover, tenant profile, posts, post detail, and settings.",
  "features": ["user-console", "frontend"]
},
{
  "path": "frontend/apps/user/src/layout/RequireViewerAuth.tsx",
  "layer": "client",
  "purpose": "Viewer session guard with loading, 401/403 redirects, and tenant-client redirect for admins/authors.",
  "features": ["user-console", "auth", "frontend"]
},
{
  "path": "frontend/apps/user/src/layout/ViewerLayout.tsx",
  "layer": "client",
  "purpose": "Viewer shell with topbar, desktop navigation, and content container.",
  "features": ["user-console", "frontend"]
},
{
  "path": "frontend/apps/user/src/lib/action/directory.action.ts",
  "layer": "client",
  "purpose": "Viewer directory API actions: overview, tenants, tenant profile, and tenant posts.",
  "features": ["user-console", "viewer-directory", "frontend"]
},
{
  "path": "frontend/apps/user/src/lib/hooks/directory.hook.ts",
  "layer": "client",
  "purpose": "TanStack hooks for the viewer overview, directory, tenant profile, and tenant posts.",
  "features": ["user-console", "viewer-directory", "frontend"]
},
{
  "path": "frontend/apps/user/src/components/Discover.tsx",
  "layer": "client",
  "purpose": "Discover orchestrator with metrics, search, category filter, tenant cards, recent posts, and pagination.",
  "features": ["user-console", "viewer-directory", "frontend"]
},
{
  "path": "frontend/apps/user/src/components/Tenant.tsx",
  "layer": "client",
  "purpose": "Tenant public page with header, published post search, and pagination.",
  "features": ["user-console", "viewer-directory", "frontend"]
},
{
  "path": "frontend/apps/user/src/components/Posts.tsx",
  "layer": "client",
  "purpose": "Global published post feed with search and pagination.",
  "features": ["user-console", "viewer-directory", "frontend"]
},
{
  "path": "frontend/apps/user/src/components/PostDetail.tsx",
  "layer": "client",
  "purpose": "Published post detail with tenant link, author, published date, and body.",
  "features": ["user-console", "viewer-directory", "frontend"]
},
{
  "path": "frontend/apps/user/src/components/Settings.tsx",
  "layer": "client",
  "purpose": "Viewer settings orchestrator: profile, password, appearance, and sign out.",
  "features": ["user-console", "settings", "frontend"]
}
```

## 3. Existing file-purpose updates

Update these entries in `files.json`:

| File                                                            | Update                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `routes/api.php`                                                | Mention viewer tenant profile and viewer overview routes.                  |
| `app/Http/Controllers/Api/Tenant/TenantDirectoryController.php` | Mention search, per_page, tenant profile, and tenant post filters.         |
| `app/Http/Controllers/Api/Tenant/PostController.php`            | Mention eager loading of tenant for the global feed.                       |
| `app/Http/Resources/PostResource.php`                           | Mention the optional tenant payload.                                       |
| `tests/Feature/TenantDirectoryTest.php`                         | Mention search, pagination, tenant profile, and tenant-on-post assertions. |

## 4. Model updates

No new model or table was added. Update the `Post` model record in `models.ts`:

```ts
relations: [
  { type: 'belongsTo', model: 'Tenant', foreignKey: 'tenant_id' },
  { type: 'belongsTo', model: 'User', foreignKey: 'user_id', note: 'author' },
],
readers: [
  'Post lists',
  'Post detail',
  'Viewer directory',
  'Viewer overview',
  'Tenant overview',
],
```

Update the `Tenant` model readers:

```ts
readers: [
  'Owner tenant list',
  'Tenant settings',
  'Tenant overview',
  'Viewer directory',
  'Viewer overview',
  'Tenant profile page',
],
```

## 5. Journey changes

### 5.1 Update `viewer-directory`

Keep the existing register, directory, and posts steps, and extend them.

Directory step:

- `request` stays `GET /api/v1/tenants`.
- Mention `search` (name/category), `name`, `category`, `per_page`, and `withQueryString`.
- Tables detail: `tenants` read with search/category, ordered by name; `posts` read with published count.

Posts step:

- `request` stays `GET /api/v1/tenants/{tenant}/posts`.
- Mention `search` (title/slug), `per_page`, and `withQueryString`.
- Response now includes `tenant` on every post.

Add a step `tenant-profile`:

```text
id: tenant-profile
title: Open a tenant profile
request: GET /api/v1/tenants/{tenant}
middleware: web, auth:web, support, tenant.active, permission:tenants.view
controller: TenantDirectoryController@show
models: Tenant, Post
tables:
  tenants read
  posts read (published count)
response: 200 TenantDirectoryResource
errors: 403 non-viewer, 404 soft-deleted tenant
speaker note: The directory resource is reused for the tenant page header.
```

Add a step `overview`:

```text
id: overview
title: Load the Discover overview
request: GET /api/v1/viewer/overview
middleware: web, auth:web, support, tenant.active, permission:tenants.view
controller: ViewerOverviewController@show
models: Tenant, Post, User
tables:
  tenants read (count, categories, recent)
  posts read (published count, recent published)
  users read (recent post authors)
response: 200 counts + categories + recent_tenants + recent_posts
errors: 403 non-viewer, 403 missing tenants.view
speaker note: Soft-deleted tenants and drafts are excluded.
```

Add a step `global-feed`:

```text
id: global-feed
title: Browse every published post
request: GET /api/v1/posts
middleware: web, auth:web, support, tenant.active, permission:posts.view.published
controller: PostController@index
models: Post, User, Tenant
tables:
  posts read (visibleTo published only)
  users read (author)
  tenants read (tenant payload)
response: 200 PostResource collection with tenant
speaker note: Viewers see published posts from every tenant, never drafts.
```

Update the journey `files`:

```text
routes/api.php
app/Http/Controllers/Api/Tenant/AuthController.php
app/Http/Requests/Tenant/RegisterRequest.php
app/Http/Controllers/Api/Tenant/TenantDirectoryController.php
app/Http/Controllers/Api/Tenant/ViewerOverviewController.php
app/Http/Controllers/Api/Tenant/PostController.php
app/Http/Resources/TenantDirectoryResource.php
app/Http/Resources/PostResource.php
app/Models/Scopes/TenantScope.php
app/Services/PermissionSyncService.php
```

### 5.2 Optional journey `viewer-client`

Add only if the Atlas should show the user frontend.

```text
id: viewer-client
kind: system
title: User client
subtitle: Login, register, discover, tenant pages, global feed, and settings.
feature: User console
realm: tenant
tone: green
```

Suggested steps:

1. `login` — login form, CSRF, `useViewerLogin`, tenant-user redirect.
2. `register` — name/email/password confirmation, auto sign-in.
3. `guard` — `RequireViewerAuth`, cached `useViewerMe` for 10 minutes.
4. `discover` — overview metrics, search, category filter, tenant cards, recent posts.
5. `tenant` — tenant header, published posts, search, pagination.
6. `feed` — global published feed and post detail.
7. `settings` — profile, password, theme, sign out.

Files: the user client files from section 2.

## 6. Architecture map updates

Update `frontend/apps/visualizer/src/data/architecture.ts`:

| Node          | Change                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `routes`      | Subtitle: `72 API operations · 56 paths`. Purpose: mention viewer overview and tenant profile. |
| `controllers` | Files: add `ViewerOverviewController.php`.                                                     |
| `frontends`   | Optional: add the user client files.                                                           |
| `models`      | Subtitle stays `13 models`; no new model or table was added.                                   |

## 7. README and docs count updates

Update stale static counts:

- `frontend/apps/visualizer/README.md`
  - `70 generated API operations` → `72 generated API operations`
  - Add the viewer discover, tenant profile, and global feed to the suggested presentation flow.
- `docs/system-atlas-data.md`
  - Example `count: 70` → `count: 72`
  - Mention `ViewerOverviewController`.

## 8. Execution order

1. Add the new backend file entries to `files.json`.
2. Update the `Post` and `Tenant` model records.
3. Extend `viewer-directory` and optionally add `viewer-client`.
4. Update `architecture.ts`, README, and docs counts.
5. Run:

```bash
pnpm generate:requests
pnpm atlas:validate
pnpm typecheck:frontend
pnpm build:visualizer
```

6. Browser-smoke:

```text
/requests   → /api/v1/tenants/{tenant}, /api/v1/viewer/overview
/journeys   → viewer-directory (tenant-profile, overview, global-feed)
/models     → Post.tenant relation, Tenant viewer readers
/           → updated route counts
```

## 9. Acceptance criteria

- `pnpm atlas:validate` reports 72 requests and the updated `viewer-directory` journey is valid.
- Every new journey request exists in the generated request catalog.
- Every referenced file is catalogued.
- Every referenced model and table exists in `models.ts`.
- `Post.tenant` and the viewer readers on `Tenant` are represented.
- Viewer overview, tenant profile, tenant post filters, and the global feed are playable in presenter mode.
- Static counts in README, docs, and architecture match the generated catalog.
- `pnpm typecheck:frontend` and `pnpm build:visualizer` pass.
