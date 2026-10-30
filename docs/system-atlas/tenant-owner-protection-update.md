# System Atlas — Tenant Owner and Admin Protection Update

> **Status:** planned, not executed.
>
> This covers the tenant-owner and admin deletion/role protection added to the tenant user API.

## 1. What changed

The first tenant admin created by the software owner is now explicitly marked as the tenant owner.

Rules:

- The tenant owner cannot be deleted by anyone.
- Only the tenant owner can delete another user with the `admin` role.
- A full-access permission (`*`) does **not** bypass these rules.
- The tenant owner’s role cannot be changed.
- Self-deletion remains blocked.
- Authors and other non-admin users can still be deleted by users with `users.delete`, subject to the rules above.

## 2. Database change

New migration:

```text
database/migrations/2026_10_31_000001_add_is_tenant_owner_to_users_table.php
```

Adds:

```text
users.is_tenant_owner boolean default false
```

Backfill:

- The earliest non-support admin per tenant is marked as the tenant owner.
- Existing tenants are backfilled by the migration.
- `TenantProvisioningService` sets `is_tenant_owner = true` for the admin it creates.
- `DemoSeeder` marks the seeded tenant admin as the owner.
- `UserFactory` has a `tenantOwner()` state.

## 3. No new routes or permissions

The API surface is unchanged:

```text
70 API operations · 54 unique paths
```

Existing permissions still apply:

```text
users.delete
users.update
```

The owner/admin rules are additional guards on top of those permissions.

## 4. Backend files to update

| File                                                 | Change                                                    |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `app/Models/User.php`                                | Add `is_tenant_owner` default, cast, and PHPDoc property. |
| `app/Services/TenantProvisioningService.php`         | Set `is_tenant_owner = true` on the provisioned admin.    |
| `database/seeders/DemoSeeder.php`                    | Mark the seeded tenant admin as owner.                    |
| `database/factories/UserFactory.php`                 | Add `tenantOwner()` state.                                |
| `app/Http/Resources/UserResource.php`                | Expose `is_tenant_owner`.                                 |
| `app/Http/Controllers/Api/Tenant/UserController.php` | Add delete and role-change guards.                        |
| `tests/Feature/UserManagementTest.php`               | Add owner/admin protection tests.                         |
| `tests/Feature/OwnerTenantTest.php`                  | Assert the provisioned admin is the tenant owner.         |

### Controller rules

`UserController@destroy`:

```text
1. Reject self-delete with 422.
2. Reject deleting the tenant owner with 422.
3. Reject deleting an admin when the actor is not the tenant owner with 403.
4. Otherwise delete.
```

`UserController@update`:

```text
Reject changing the tenant owner role away from admin with 422.
```

## 5. File catalog updates

Update these existing `files.json` purposes:

| File                                                                           | New purpose                                                 |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `app/Models/User.php`                                                          | Add `is_tenant_owner` marker for the original tenant admin. |
| `app/Services/TenantProvisioningService.php`                                   | Marks the first admin as tenant owner.                      |
| `app/Http/Resources/UserResource.php`                                          | Exposes tenant-owner status.                                |
| `app/Http/Controllers/Api/Tenant/UserController.php`                           | Enforces tenant-owner and admin deletion rules.             |
| `database/migrations/2026_10_31_000001_add_is_tenant_owner_to_users_table.php` | Adds and backfills `is_tenant_owner`.                       |
| `tests/Feature/UserManagementTest.php`                                         | Covers owner/admin protection.                              |

Add the migration to the file catalog if not already present.

## 6. Model updates

Update the `User` model record in `models.ts`:

```ts
columns: [
  // existing columns...
  { name: 'is_tenant_owner', type: 'boolean', note: 'original tenant admin; cannot be deleted' },
],
readers: [
  'Login',
  'auth:me',
  'User lists',
  'Permission checks',
  'Tenant overview',
  'User deletion guard',
],
writers: [
  'Tenant provisioning (first admin)',
  'DemoSeeder',
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

No table count changes; `users` already exists.

## 7. New journey `tenant-user-protection`

```text
id: tenant-user-protection
kind: journey
title: Tenant owner and admin protection
subtitle: Owner cannot be deleted; only the owner can delete admins.
feature: Tenant users
realm: tenant
tone: red
```

Steps:

1. `delete-owner` — `DELETE /api/v1/users/{user}` where target is the tenant owner
   - controller `UserController@destroy`
   - models `User`
   - tables `users` read
   - response `422 The tenant owner cannot be deleted.`
   - speaker note: `*` permissions do not bypass this.
2. `delete-admin-as-admin` — non-owner admin deletes another admin
   - response `403 Only the tenant owner can delete an admin.`
3. `delete-admin-as-full-access-author` — author with `*` deletes an admin
   - response `403`
4. `delete-admin-as-owner` — tenant owner deletes another admin
   - response `204`
5. `change-owner-role` — change tenant owner role to author
   - response `422 The tenant owner role cannot be changed.`
6. `delete-self` — any user deletes themselves
   - response `422 You cannot delete yourself.`

Files:

```text
app/Http/Controllers/Api/Tenant/UserController.php
app/Models/User.php
app/Http/Resources/UserResource.php
database/migrations/2026_10_31_000001_add_is_tenant_owner_to_users_table.php
```

## 8. Frontend updates

If the tenant client journey is added to the Atlas, note these UI changes:

- User table/detail show an **Owner** badge.
- Delete is hidden for the tenant owner.
- Delete is hidden for admin users unless the current user is the tenant owner.
- The role selector is disabled when editing the tenant owner.
- Self-delete remains hidden.

Files:

```text
frontend/apps/tenant/src/components/user/UserTable.tsx
frontend/apps/tenant/src/components/UserDetail.tsx
frontend/apps/tenant/src/components/user/UserForm.tsx
frontend/apps/tenant/src/lib/types/auth.type.ts
```

## 9. Validation

```bash
pnpm generate:requests
pnpm atlas:validate
pnpm typecheck:frontend
pnpm build:visualizer
```

Browser-smoke:

```text
/journeys/tenant-user-protection
/journeys/tenant-user-invitations
/models?model=User
/requests?path=%2Fapi%2Fv1%2Fusers%2F%7Buser%7D
```

## 10. Acceptance criteria

- `User.is_tenant_owner` is represented in the model/table explorer.
- The new journey covers owner deletion, admin deletion, role change, and self-delete.
- The `files.json` purposes reflect the new guard logic.
- The migration is catalogued.
- Counts remain `70 API operations · 54 paths`, `13 models`, `6 commands`.
- `pnpm atlas:validate`, `pnpm typecheck:frontend`, and `pnpm build:visualizer` pass.
