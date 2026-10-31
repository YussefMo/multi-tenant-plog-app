# System Atlas — Mail and Resend Invitation Update

> **Status:** planned, not executed.
>
> This is a documentation-only Atlas update. No routes, models, tables, commands, permissions, or journey logic changed.

## 1. What changed

Invitation emails now use the configured Laravel mailer. The local environment uses `log`; the showcase environment uses Resend SMTP.

Current showcase mail configuration:

```text
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_FROM_ADDRESS=no-reply@send.ymdev.me
```

The invitation flow itself is unchanged:

- `TenantInvitationNotification` builds the email.
- `Notification::route('mail', ...)` sends it.
- The mailer comes from `config/mail.php` and the `MAIL_*` environment variables.

## 2. Add `config/mail.php` to `files.json`

The file is not currently catalogued. Add:

```json
{
  "path": "config/mail.php",
  "layer": "config",
  "purpose": "Defines the default Laravel mailer, SMTP/Resend transports, and the global from address used by invitation emails.",
  "features": ["mail", "invitations", "notifications"]
}
```

This is the only new file-catalog entry.

## 3. Update the invitation journeys

Add `config/mail.php` to:

- `tenant-provisioning` journey `files`
- The `mail` step in `tenant-provisioning`
- The planned `tenant-user-invitations` journey in `docs/system-atlas/tenant-console-update.md`

### `tenant-provisioning` mail step

Current note:

```text
TenantInvitationNotification is sent to the admin email with a frontend URL built by FrontendUrlService.
```

Add:

```text
Invitation mail uses Laravel's configured mailer. Local development uses the log mailer; the showcase deployment uses Resend SMTP with no-reply@send.ymdev.me.
```

### `tenant-user-invitations` journey

Add the same note to the invite/resend steps:

```text
The notification is delivered through the configured mailer. The provider is environment-specific.
```

## 4. Optional docs note

In `docs/system-atlas/tenant-console-update.md`, add:

```text
Invitation mail is provider-configurable through config/mail.php and MAIL_* environment variables. The current showcase uses Resend SMTP.
```

## 5. What does not change

- No new API routes.
- No new models or tables.
- No new commands.
- No new permissions.
- No new journey logic.
- No changes to the invitation token, hashing, expiry, or acceptance flow.

Counts remain:

```text
70 API operations · 54 paths
13 models
6 commands
```

The file catalog increases by one file:

```text
config/mail.php
```

## 6. Validation

```bash
pnpm generate:requests
pnpm atlas:validate
pnpm typecheck:frontend
pnpm build:visualizer
```

Browser-smoke:

```text
/journeys/tenant-provisioning
/journeys/tenant-user-invitations
/files
/requests?path=%2Fapi%2Fv1%2Fowner%2Ftenants
```

## 7. Acceptance criteria

- `config/mail.php` is catalogued in `files.json`.
- `tenant-provisioning` references `config/mail.php` in its files and mail step.
- `tenant-user-invitations` mentions the configured mailer.
- The Atlas does not hardcode Resend as the only provider; it documents the configured mailer.
- `pnpm atlas:validate`, `pnpm typecheck:frontend`, and `pnpm build:visualizer` pass.
