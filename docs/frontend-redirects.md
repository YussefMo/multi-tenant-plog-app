# Frontend Redirect Map

Three separate frontends use this API. Each has its own domain.

| Frontend         | Env var               | Local default                                 |
| ---------------- | --------------------- | --------------------------------------------- |
| Owner dashboard  | `OWNER_FRONTEND_URL`  | `http://owner.multi-tenant-plog.test`         |
| Tenant dashboard | `TENANT_FRONTEND_URL` | `http://{slug}.tenant.multi-tenant-plog.test` |
| User web         | `USER_FRONTEND_URL`   | `http://{slug}.user.multi-tenant-plog.test`   |
| API              | `APP_URL`             | `http://multi-tenant-plog.test/api`           |

`{slug}` is replaced with the tenant slug. For real custom tenant domains, set the env values to your real URLs or add per-tenant domain columns later.

## Backend-provided redirect URLs

The API returns `redirect_url` so the frontend never has to hardcode domain rules.

| Endpoint                                     | Response field | Destination                                              |
| -------------------------------------------- | -------------- | -------------------------------------------------------- |
| `POST /api/v1/owner/auth/login`              | `redirect_url` | Owner dashboard                                          |
| `GET /api/v1/owner/auth/me`                  | `redirect_url` | Owner dashboard                                          |
| `POST /api/v1/owner/tenants/{tenant}/access` | `redirect_url` | Tenant frontend `/support/accept?ticket=...`             |
| `POST /api/v1/auth/login`                    | `redirect_url` | Tenant dashboard for admin/author, user web for viewer   |
| `GET /api/v1/auth/me`                        | `redirect_url` | Same role-based destination                              |
| `POST /api/v1/auth/support-login`            | `redirect_url` | Tenant dashboard                                         |
| `POST /api/v1/auth/support/end`              | `redirect_url` | Owner dashboard                                          |
| Invitation email link                        | —              | Tenant frontend `/accept-invitation?email=...&token=...` |

## Session and CORS rules

### Recommended local setup: subdomains of one base

All three frontends and the API are subdomains of `multi-tenant-plog.test`:

```dotenv
SESSION_DOMAIN=.multi-tenant-plog.test
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=false
```

This lets the browser send the `tenant_session` / `owner_session` cookies to the API from any frontend subdomain.

### Separate registrable domains

If the frontends are on completely different domains, the API cookies become third-party:

```dotenv
SESSION_DOMAIN=null
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
```

Requirements:

- HTTPS on both API and frontends
- `CORS_ALLOWED_ORIGINS` lists the exact frontend origins
- `CORS_ALLOWED_ORIGIN_PATTERNS` covers per-tenant subdomains
- frontend fetches use `credentials: 'include'`

## CSRF flow

1. `GET /api/v1/csrf-token` — tenant realm
2. `GET /api/v1/owner/csrf-token` — owner realm
3. Send `X-CSRF-TOKEN: <csrf_token>` on every mutating request.
4. After login/support-login, use the **new** `csrf_token` from the response.

## Owner flows

### Owner login

```
Owner /login
  → POST /api/v1/owner/auth/login
  → response.redirect_url
  → Owner dashboard /
```

### Owner creates a tenant

```
Owner /tenants/new
  → POST /api/v1/owner/tenants
  → 201 { data, admin, invitation }
  → stay on owner tenant detail (invitation is emailed)
```

The admin invitation email points to:

```
{TENANT_FRONTEND_URL}/accept-invitation?email=...&token=...
```

## Tenant auth flows

### Admin / author login

```
Tenant /login
  → POST /api/v1/auth/login
  → redirect_url = tenant dashboard
```

### Viewer login

```
User web /login
  → POST /api/v1/auth/login
  → redirect_url = user web dashboard
```

If a viewer logs in on the tenant login page, still use `redirect_url`; it will point to the user web.

### Invitation acceptance

```
Tenant /accept-invitation?email&token
  → POST /api/v1/auth/accept-invitation
  → success
  → tenant /login
```

## Owner support access

This is the important cross-frontend flow.

```
1. Owner /tenants/{id}
   POST /api/v1/owner/tenants/{id}/access
   ← 201 { ticket, expires_at, redirect_url }
   → window.location.assign(redirect_url)

2. Tenant frontend /support/accept?ticket=...
   → GET /api/v1/csrf-token (tenant realm)
   → POST /api/v1/auth/support-login { ticket }
   ← 200 { data, csrf_token, support: true, redirect_url }
   → window.location.assign(redirect_url)   // tenant dashboard

3. During support:
   every tenant API request re-checks allow_support
   idle timeout: 5 minutes without a request

4. End support:
   POST /api/v1/auth/support/end
   ← 200 { message, redirect_url }  // owner dashboard
```

- Ticket lifetime: **5 minutes** (`SUPPORT_TICKET_TTL_MINUTES`).
- Support session idle timeout: **5 minutes** (`SUPPORT_SESSION_IDLE_MINUTES`).
- Ticket is single-use.
- If `allow_support` is disabled or the tenant is deleted, the tenant session is invalidated and the next request returns **403**.
- When that happens, redirect to the tenant login page with a “support access ended” message. The owner can retry from the owner dashboard if the flag is re-enabled.

## Error redirects

| Status                  | Frontend action                                              |
| ----------------------- | ------------------------------------------------------------ |
| `401`                   | Go to the login page of the current frontend                 |
| `403` (support revoked) | Clear support session, go to tenant login or owner dashboard |
| `404` (cross-tenant)    | Go to the current dashboard                                  |
| `419` (CSRF)            | Fetch a new CSRF token, then retry once                      |
| `422`                   | Stay on the form and render validation errors                |

## Frontend route map

### Owner dashboard

- `/login`
- `/`
- `/tenants`
- `/tenants/{id}`

### Tenant dashboard

- `/login`
- `/accept-invitation`
- `/support/accept`
- `/`

### User web

- `/login`
- `/`

## Example fetch

```ts
await fetch('http://multi-tenant-plog.test/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-CSRF-TOKEN': csrfToken,
  },
  body: JSON.stringify({ email, password }),
});
```

## Notes

- The backend does not issue HTTP 302 redirects. The API returns JSON `redirect_url`; the frontend performs the navigation. This is required because the API and the three frontends are separate origins.
- Never put the Stripe secret or webhook secret in any frontend.
- The support ticket is an opaque one-time credential; do not log it.
- Generated invitation/support links use the frontend URL config, not the API URL.
