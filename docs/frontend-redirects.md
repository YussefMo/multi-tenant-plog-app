# Frontend Redirect Map

Three separate frontends use this API. Each has its own domain.

| Frontend         | Env var               | Local default                       |
| ---------------- | --------------------- | ----------------------------------- |
| Owner dashboard  | `OWNER_FRONTEND_URL`  | `http://localhost:3000`             |
| Tenant dashboard | `TENANT_FRONTEND_URL` | `http://localhost:3001`             |
| User web         | `USER_FRONTEND_URL`   | `http://localhost:3002`             |
| API              | `APP_URL`             | `http://multi-tenant-plog.test/api` |

Tenant resolution never uses a slug. Admin/author scope comes from the globally unique email plus `users.tenant_id`. Viewers have no tenant and browse all tenants through the directory.

## Backend-provided redirect URLs

The API returns `redirect_url` so the frontend never has to hardcode domain rules.

| Endpoint                                     | Response field | Destination                                              |
| -------------------------------------------- | -------------- | -------------------------------------------------------- |
| `POST /api/v1/owner/auth/login`              | `redirect_url` | Owner dashboard                                          |
| `GET /api/v1/owner/auth/me`                  | `redirect_url` | Owner dashboard                                          |
| `POST /api/v1/owner/tenants/{tenant}/access` | `redirect_url` | Tenant frontend `/support/accept?ticket=...`             |
| `POST /api/v1/auth/login`                    | `redirect_url` | Tenant dashboard for admin/author, user web for viewer   |
| `POST /api/v1/auth/register`                 | `redirect_url` | User web dashboard                                       |
| `GET /api/v1/auth/me`                        | `redirect_url` | Same role-based destination                              |
| `POST /api/v1/auth/support-login`            | `redirect_url` | Tenant dashboard                                         |
| `POST /api/v1/auth/support/end`              | `redirect_url` | Owner dashboard                                          |
| `POST /api/v1/billing/checkout`              | `checkout_url` | Stripe-hosted Checkout                                   |
| `POST /api/v1/billing/portal`                | `portal_url`   | Stripe Customer Portal                                   |
| Invitation email link                        | —              | Tenant frontend `/accept-invitation?email=...&token=...` |

## Session and CORS rules

### Local frontends on localhost ports

The default local frontends are:

```text
Owner  http://localhost:3000
Tenant http://localhost:3001
User   http://localhost:3002
```

`SESSION_DOMAIN=null` is the safe local default. It makes the session cookie host-only, so it works whether the API is reached at `http://localhost:8000` (`composer dev`) or `http://multi-tenant-plog.test` (Nginx).

```dotenv
SESSION_DOMAIN=null
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=false
```

CORS is configured for the three localhost origins (and their `127.0.0.1` equivalents):

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002
```

If you use `composer dev`, point the frontend API base URL at:

```text
http://localhost:8000/api
```

and optionally set:

```dotenv
APP_URL=http://localhost:8000
PUBLIC_API_URL=http://localhost:8000
```

`localhost` frontends and `localhost:8000` are the same site, so session cookies are not third-party.

If the API stays on `multi-tenant-plog.test` while the frontends run on `localhost`, direct cross-origin browser requests make the API session cookies third-party. For reliable local development, proxy `/api` through each frontend dev server, or run the API on `localhost:8000` as above.

Direct cross-site cookie mode requires HTTPS and third-party-cookie support:

```dotenv
SESSION_DOMAIN=null
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
```

Frontend fetches must use:

```ts
credentials: "include";
```

### CSRF flow

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

### Viewer signup

```
User web /signup
  → GET /api/v1/csrf-token
  → POST /api/v1/auth/register { name, email, password, password_confirmation }
  ← 201 { data, csrf_token, redirect_url }
  → window.location.assign(redirect_url)   // user web dashboard
```

The viewer is created with `role = user`, `tenant_id = null`, and the viewer preset (`posts.view.published`, `tenants.view`).

### Viewer login

```
User web /login
  → POST /api/v1/auth/login
  → redirect_url = user web dashboard
```

If a viewer logs in on the tenant login page, still use `redirect_url`; it will point to the user web.

### Viewer tenant directory

```
User web /tenants
  → GET /api/v1/tenants?name=&category=
  ← paginated { id, name, category, published_posts_count }

User web /tenants/{id}
  → GET /api/v1/tenants/{id}/posts
  ← paginated published posts for that tenant
```

Only published posts are returned. Admin/author accounts cannot use the directory (403); their post access stays tenant-scoped.

### Invitation acceptance

```
Tenant /accept-invitation?email&token
  → POST /api/v1/auth/accept-invitation
  → success
  → tenant /login
```

The `tenant_invitations.token_hash` column contains only the SHA-256 hash. Use the raw token from the invitation email, or from `invitation.token` in the local/testing tenant-creation response. The database hash will not work.

## Billing flow

The frontend never loads Stripe.js. It only redirects to the URL returned by the API.

```
Tenant /billing
  → POST /api/v1/billing/checkout { plan_id }
  ← 201 { checkout_url, session_id }
  → window.location.assign(checkout_url)

Stripe Checkout (hosted by Stripe)
  → GET {PUBLIC_API_URL}/api/v1/billing/checkout/success?session_id=...
  → 302 {TENANT_FRONTEND_URL}/billing?status=success
```

| Stripe return    | API redirect                |
| ---------------- | --------------------------- |
| Checkout success | `/billing?status=success`   |
| Checkout cancel  | `/billing?status=cancelled` |
| Portal return    | `/billing?status=portal`    |

The API uses `PUBLIC_API_URL` for these Stripe-facing URLs, so changing the ngrok hostname only requires updating that env value and clearing config.

When `tenant.is_due` is `true`, block the rest of the tenant UI and keep only the billing tab visible. The flag is available in `GET /auth/me` and `GET /tenant`.

Webhooks update the subscription even if the user closes the browser before returning. See [`billing.md`](billing.md).

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
- `/billing`
- `/`

### User web

- `/signup`
- `/login`
- `/tenants`
- `/tenants/{id}`
- `/`

## Example fetch

```ts
await fetch("http://multi-tenant-plog.test/api/v1/auth/login", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-CSRF-TOKEN": csrfToken,
  },
  body: JSON.stringify({ email, password }),
});
```

## Notes

- The backend does not issue HTTP 302 redirects. The API returns JSON `redirect_url`; the frontend performs the navigation. This is required because the API and the three frontends are separate origins.
- Never put the Stripe secret or webhook secret in any frontend.
- The support ticket is an opaque one-time credential; do not log it.
- Generated invitation/support links use the frontend URL config, not the API URL.
- Tenant directory endpoints bypass the global tenant scope on purpose so viewers can read published posts across tenants. Draft and unpublished posts remain tenant-scoped.
