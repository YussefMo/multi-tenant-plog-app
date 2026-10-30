# System Atlas — Tenant Console Update Plan

> **Status:** planned, not executed.
>
> Execute after the tenant console work is merged and the user client work is finished.

## 1. What is automatic vs manual

| Atlas surface    | Source                                          | Picks up tenant changes automatically?                                   |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| `/requests`      | `php artisan route:list --json --except-vendor` | **Yes.** Regenerated on predev, pretypecheck, prebuild, and prevalidate. |
| `/files`         | `src/data/files.json`                           | **No.** Static catalog.                                                  |
| `/models`        | `src/data/models.ts`                            | **No.** Static catalog.                                                  |
| `/journeys`      | `src/data/journeys.ts`                          | **No.** Static catalog.                                                  |
| `/commands`      | `src/data/commands.ts`                          | **No.** No command changed.                                              |
| Architecture map | `src/data/architecture.ts`                      | **No.** Static catalog.                                                  |

Current generated catalog after the tenant backend changes:

```text
69 API operations · 53 unique paths
130 catalogued files
16 journeys
13 models
5 commands
```

The tenant routes below are already generated but are not represented in journeys or the architecture map:

```text
POST   /api/v1/users/{user}/invite
GET    /api/v1/permissions
GET    /api/v1/tenant/overview
PATCH  /api/v1/auth/profile
PUT    /api/v1/auth/password
```

The existing endpoints also gained filters/pagination:

```text
GET /api/v1/users       search, role, permission_profile_id, per_page, page
GET /api/v1/posts       search, status, author_id, per_page, page
GET /api/v1/profiles    search, per_page, page
GET /api/v1/billing/invoices   per_page
GET /api/v1/billing/payments   per_page
GET /api/v1/auth/me     support, support_owner_id, support_tenant_id
```

## 2. File catalog additions

Add these entries to `frontend/apps/visualizer/src/data/files.json`.

```json
{
  "path": "app/Services/TenantInvitationService.php",
  "layer": "service",
  "purpose": "Creates and replaces tenant user invitations, hashes tokens, invalidates old pending invitations, and returns a local/testing token.",
  "features": ["tenant-users", "invitations", "tenant-console"]
},
{
  "path": "app/Http/Controllers/Api/Tenant/PermissionCatalogController.php",
  "layer": "controller",
  "purpose": "Returns the permission catalog and role presets for tenant user and profile forms.",
  "features": ["permissions", "tenant-users", "tenant-console"]
},
{
  "path": "app/Http/Controllers/Api/Tenant/TenantOverviewController.php",
  "layer": "controller",
  "purpose": "Returns permission-aware tenant counts, post status counts, and subscription summary for the tenant dashboard.",
  "features": ["tenant-dashboard", "tenant-console"]
},
{
  "path": "app/Http/Requests/Tenant/UpdateProfileRequest.php",
  "layer": "request",
  "purpose": "Validates tenant user name/email updates and unique email.",
  "features": ["auth", "tenant-settings"]
},
{
  "path": "app/Http/Requests/Tenant/UpdatePasswordRequest.php",
  "layer": "request",
  "purpose": "Validates current password, new password, and confirmation for tenant users.",
  "features": ["auth", "tenant-settings"]
},
{
  "path": "tests/Feature/TenantOverviewTest.php",
  "layer": "test",
  "purpose": "Covers permission-aware tenant overview counts and subscription output.",
  "features": ["tenant-dashboard", "tests"]
}
```

### Optional tenant-console client journey

Add only if the Atlas should show the tenant frontend:

```json
{
  "path": "frontend/apps/tenant/src/routes.tsx",
  "layer": "client",
  "purpose": "Tenant console route table: auth pages and console pages.",
  "features": ["tenant-console", "frontend"]
},
{
  "path": "frontend/apps/tenant/src/layout/RequireTenantAuth.tsx",
  "layer": "client",
  "purpose": "Tenant session guard with loading, 401/403 redirects, and viewer redirect.",
  "features": ["tenant-console", "auth", "frontend"]
},
{
  "path": "frontend/apps/tenant/src/layout/ConsoleLayout.tsx",
  "layer": "client",
  "purpose": "Tenant console shell with sidebar, topbar, support banner, and mobile navigation.",
  "features": ["tenant-console", "frontend"]
},
{
  "path": "frontend/apps/tenant/src/lib/action/user.action.ts",
  "layer": "client",
  "purpose": "Tenant user API actions including invite and resend invitation.",
  "features": ["tenant-console", "tenant-users", "frontend"]
},
{
  "path": "frontend/apps/tenant/src/lib/hooks/user.hook.ts",
  "layer": "client",
  "purpose": "TanStack hooks for tenant users and invitation mutations.",
  "features": ["tenant-console", "tenant-users", "frontend"]
},
{
  "path": "frontend/apps/tenant/src/components/Users.tsx",
  "layer": "client",
  "purpose": "Tenant user list orchestrator with filters, pagination, and invitation actions.",
  "features": ["tenant-console", "tenant-users", "frontend"]
},
{
  "path": "frontend/apps/tenant/src/components/Dashboard.tsx",
  "layer": "client",
  "purpose": "Tenant dashboard with counts, recent posts, subscription, and recent billing.",
  "features": ["tenant-console", "tenant-dashboard", "frontend"]
}
```

## 3. Existing file-purpose updates

Update these entries in `files.json`:

| File                                                              | Update                                                                                        |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `routes/api.php`                                                  | Mention tenant profile/password, permissions catalog, tenant overview, and user invite route. |
| `app/Http/Controllers/Api/Tenant/UserController.php`              | Mention invite/resend, invitation status, filters, and admin/author-only role restriction.    |
| `app/Http/Controllers/Api/Tenant/AuthController.php`              | Mention tenant profile/password updates and support-session state in `/auth/me`.              |
| `app/Http/Controllers/Api/Tenant/PostController.php`              | Mention search, status, author, and pagination filters.                                       |
| `app/Http/Controllers/Api/Tenant/PermissionProfileController.php` | Mention search and pagination.                                                                |
| `app/Http/Controllers/Api/Tenant/BillingController.php`           | Mention `per_page` for invoices and payments.                                                 |
| `app/Http/Requests/Tenant/StoreUserRequest.php`                   | Mention invite flag, password confirmation, and admin/author-only roles.                      |
| `app/Http/Requests/Tenant/UpdateUserRequest.php`                  | Mention admin/author-only roles and optional password confirmation.                           |
| `app/Models/User.php`                                             | Mention `latestInvitation` relation.                                                          |
| `app/Http/Resources/UserResource.php`                             | Mention invitation status.                                                                    |
| `app/Services/TenantProvisioningService.php`                      | Mention delegation to `TenantInvitationService`.                                              |

## 4. Model updates

No new model or table was added. Update the `User` model record in `models.ts`:

```ts
relations: [
  { type: 'belongsTo', model: 'Tenant', foreignKey: 'tenant_id' },
  { type: 'belongsTo', model: 'PermissionProfile', foreignKey: 'permission_profile_id' },
  { type: 'hasMany', model: 'Post', foreignKey: 'user_id' },
  { type: 'hasOne', model: 'TenantInvitation', foreignKey: 'email' },
],
readers: ['Login', 'auth:me', 'User lists', 'Permission checks', 'Tenant overview'],
writers: [
  'Invitation acceptance',
  'Viewer registration',
  'User create/update',
  'User invite/resend',
  'Tenant profile/password update',
  'permissions:sync',
  'Support user creation',
  'tenants:purge',
],
```

Update `TenantInvitation` readers/writers:

```ts
readers: ['Invitation acceptance', 'User invitation status'],
writers: ['Tenant provisioning', 'Tenant user invite/resend', 'Invitation acceptance'],
```

## 5. Journey changes

### 5.1 New journey `tenant-user-invitations`

```text
id: tenant-user-invitations
kind: journey
title: Tenant user invitations
subtitle: Invite admins/authors, resend invitations, and accept with a password.
feature: Tenant users
realm: tenant
tone: amber
```

Steps:

1. `create-invite` — `POST /api/v1/users`
   - controller `UserController@store`
   - request class `StoreUserRequest`
   - service `TenantInvitationService::create`
   - models `User`, `TenantInvitation`
   - tables `users` insert, `tenant_invitations` insert
   - response `201 UserResource + invitation`
   - errors `422 role must be admin/author`, `422 password required when invite=false`
2. `resend` — `POST /api/v1/users/{user}/invite`
   - controller `UserController@invite`
   - service `TenantInvitationService::create`
   - models `User`, `TenantInvitation`
   - tables `tenant_invitations` delete/insert
   - response `200 invitation`
   - errors `422 user already accepted`
3. `accept` — `POST /api/v1/auth/accept-invitation`
   - controller `AuthController@acceptInvitation`
   - request class `AcceptInvitationRequest`
   - models `TenantInvitation`, `User`
   - tables `tenant_invitations` update, `users` update
   - response `200 message`
   - errors `422 invalid or expired token`
4. `login` — `POST /api/v1/auth/login`
   - controller `AuthController@login`
   - models `User`, `Tenant`
   - tables `users` read, `sessions` upsert
   - response `200 UserResource + redirect_url`

Files:

```text
app/Http/Controllers/Api/Tenant/UserController.php
app/Http/Requests/Tenant/StoreUserRequest.php
app/Services/TenantInvitationService.php
app/Notifications/TenantInvitationNotification.php
app/Http/Controllers/Api/Tenant/AuthController.php
app/Http/Requests/Tenant/AcceptInvitationRequest.php
app/Models/TenantInvitation.php
app/Models/User.php
```

### 5.2 New journey `tenant-overview`

```text
id: tenant-overview
kind: journey
title: Tenant dashboard overview
subtitle: Permission-aware counts and subscription summary.
feature: Tenant dashboard
realm: tenant
tone: cyan
```

Steps:

1. `request` — `GET /api/v1/tenant/overview`
   - controller `TenantOverviewController@show`
   - models `Tenant`, `User`, `PermissionProfile`, `Post`, `Subscription`
   - tables `tenants`, `users`, `permission_profiles`, `posts`, `subscriptions` read
   - response `200 counts + subscription`
   - speaker note: sections are null when the user lacks `users.view`, `profiles.view`, or `billing.view`.

Files:

```text
app/Http/Controllers/Api/Tenant/TenantOverviewController.php
app/Models/Tenant.php
app/Models/User.php
app/Models/PermissionProfile.php
app/Models/Post.php
app/Models/Subscription.php
```

### 5.3 New journey `tenant-account-security`

```text
id: tenant-account-security
kind: journey
title: Tenant account profile and password
subtitle: Self-service profile and password update with current-password verification.
feature: Tenant settings
realm: tenant
tone: green
```

Steps:

1. `profile` — `PATCH /api/v1/auth/profile`
   - controller `AuthController@updateProfile`
   - request class `UpdateProfileRequest`
   - models `User`
   - table `users` update
   - errors `422 duplicate email`
2. `password` — `PUT /api/v1/auth/password`
   - controller `AuthController@updatePassword`
   - request class `UpdatePasswordRequest`
   - models `User`
   - table `users` update
   - errors `422 wrong current password`
   - speaker note: the session stays valid.

### 5.4 New journey `tenant-permission-profiles`

```text
id: tenant-permission-profiles
kind: journey
title: Tenant permission profiles
subtitle: Catalog, create, update, and delete-guard behavior.
feature: Permissions
realm: tenant
tone: amber
```

Steps:

1. `catalog` — `GET /api/v1/permissions`
   - controller `PermissionCatalogController@index`
   - response catalog + presets
2. `list` — `GET /api/v1/profiles`
   - controller `PermissionProfileController@index`
   - models `PermissionProfile`
   - tables `permission_profiles`, `users` read
3. `create` — `POST /api/v1/profiles`
   - controller `PermissionProfileController@store`
   - request class `StorePermissionProfileRequest`
   - models `PermissionProfile`
   - table `permission_profiles` insert
4. `update` — `PATCH /api/v1/profiles/{profile}`
   - controller `PermissionProfileController@update`
   - request class `UpdatePermissionProfileRequest`
   - models `PermissionProfile`, `User`
   - tables `permission_profiles` update, `users` update
5. `delete-guard` — `DELETE /api/v1/profiles/{profile}`
   - controller `PermissionProfileController@destroy`
   - models `PermissionProfile`, `User`
   - errors `409 profile assigned to users`

### 5.5 New journey `tenant-billing-history`

```text
id: tenant-billing-history
kind: journey
title: Tenant billing history
subtitle: Invoices and payments with status, date, and pagination filters.
feature: Tenant billing
realm: tenant
tone: amber
```

Steps:

1. `invoices` — `GET /api/v1/billing/invoices`
   - controller `BillingController@invoices`
   - models `BillingInvoice`
   - table `billing_invoices` read
2. `payments` — `GET /api/v1/billing/payments`
   - controller `BillingController@payments`
   - models `BillingPayment`
   - table `billing_payments` read

### 5.6 Update existing journeys

- `tenant-provisioning`: replace the inline invitation with `TenantInvitationService`; add the service file.
- `support-access`: add the `/auth/me` support state step (`support`, `support_owner_id`, `support_tenant_id`) and the tenant support banner behavior.
- `permission-resync`: mention profile CRUD and the permission catalog endpoint.
- `billing-checkout`: mention tenant invoice/payment history or link to `tenant-billing-history`.

### 5.7 Optional journey `tenant-console-client`

Add only if the Atlas should show the tenant frontend.

```text
id: tenant-console-client
kind: system
title: Tenant console client
subtitle: Login, guard, dashboard, posts, users, profiles, billing, and settings.
feature: Tenant console
realm: tenant
tone: cyan
```

Suggested steps:

1. `login` — login form, CSRF, `useTenantLogin`, viewer redirect.
2. `guard` — `RequireTenantAuth`, cached `useTenantMe`, 401/403 handling.
3. `dashboard` — overview, recent posts, subscription, billing.
4. `posts` — list, create, edit, publish/unpublish/delete.
5. `users` — invite checkbox, password fallback, resend invitation.
6. `profiles` — grouped permission selector, delete guard.
7. `billing` — subscription, plans, invoices, payments.
8. `settings` — tenant settings, profile/password, support session.

Files: the optional tenant client files from section 2.

## 6. Architecture map updates

Update `frontend/apps/visualizer/src/data/architecture.ts`:

| Node          | Change                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `routes`      | Subtitle: `69 API operations · 53 paths`. Purpose: mention tenant overview, permissions catalog, profile/password, and user invites. |
| `controllers` | Files: add `PermissionCatalogController.php`, `TenantOverviewController.php`.                                                        |
| `services`    | Files: add `TenantInvitationService.php`.                                                                                            |
| `requests`    | Files: add `UpdateProfileRequest.php`, `UpdatePasswordRequest.php`.                                                                  |
| `frontends`   | Optional: add the tenant console client files.                                                                                       |
| `models`      | Subtitle stays `13 models`; no new model was added.                                                                                  |

## 7. README and docs count updates

Update stale static counts:

- `frontend/apps/visualizer/README.md`
  - `60 generated API operations` → `69 generated API operations`
  - Add tenant user invitations, tenant overview, tenant account security, tenant permission profiles, and tenant billing history to the suggested presentation flow.
- `docs/system-atlas-data.md`
  - Example `count: 60` → `count: 69`
  - Mention `TenantInvitationService`, `PermissionCatalogController`, and `TenantOverviewController`.
- `frontend/apps/visualizer/src/data/architecture.ts`
  - Update the routes subtitle as above.

## 8. Execution order

1. Add the new backend file entries to `files.json`.
2. Update the `User` and `TenantInvitation` model records.
3. Add the five tenant journeys and update the existing tenant journeys.
4. Optionally add the tenant client files and `tenant-console-client` journey.
5. Update `architecture.ts`, README, and docs counts.
6. Run:

```bash
pnpm generate:requests
pnpm atlas:validate
pnpm typecheck:frontend
pnpm build:visualizer
```

7. Browser-smoke:

```text
/requests   → tenant invite, permissions, overview, profile, password routes
/journeys   → tenant-user-invitations, tenant-overview, tenant-account-security,
              tenant-permission-profiles, tenant-billing-history
/models     → User.latestInvitation relation and invitation status
/commands   → unchanged
/           → updated route counts and tenant files
```

## 9. Acceptance criteria

- `pnpm atlas:validate` reports 69 requests and all new tenant journeys valid.
- Every new journey request exists in the generated request catalog.
- Every referenced file is catalogued.
- Every referenced model and table exists in `models.ts`.
- `User.latestInvitation` and invitation status are represented.
- Tenant overview, invitations, account security, permission profiles, and billing history are playable in presenter mode.
- Static counts in README, docs, and architecture match the generated catalog.
- `pnpm typecheck:frontend` and `pnpm build:visualizer` pass.
