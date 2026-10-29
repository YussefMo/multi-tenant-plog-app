# Billing and Stripe

The backend owns the entire Stripe flow. Frontends never load Stripe.js and never send amounts or price IDs. They only:

1. call `POST /api/v1/billing/checkout` with a `plan_id`;
2. redirect the browser to the returned `checkout_url`;
3. show the result after Stripe redirects back through the API.

Stripe Checkout is **hosted by Stripe**, so the payment form is rendered on Stripe's domain. The backend creates sessions, verifies webhooks, and keeps a local mirror of subscriptions, invoices, and payments.

## Required environment

```dotenv
APP_URL=http://multi-tenant-plog.test
PUBLIC_API_URL=http://multi-tenant-plog.test

STRIPE_MODE=sandbox
STRIPE_ALLOW_LIVE=false
STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
STRIPE_API_VERSION=2026-09-30.endive

STRIPE_PLAN_1_PRODUCT_ID=
STRIPE_PLAN_1_PRICE_ID=
STRIPE_PLAN_1_AMOUNT=5000
STRIPE_PLAN_1_CURRENCY=usd
STRIPE_PLAN_1_INTERVAL=month

STRIPE_PLAN_2_PRODUCT_ID=
STRIPE_PLAN_2_PRICE_ID=
STRIPE_PLAN_2_AMOUNT=20000
STRIPE_PLAN_2_CURRENCY=usd
STRIPE_PLAN_2_INTERVAL=month
```

`PUBLIC_API_URL` is the **public origin only**, without `/api`:

```dotenv
PUBLIC_API_URL=https://your-ngrok-subdomain.ngrok-free.app
```

After changing it:

```bash
php artisan config:clear
```

Stripe needs this URL for:

- Checkout success:
  `{PUBLIC_API_URL}/api/v1/billing/checkout/success?session_id={CHECKOUT_SESSION_ID}`
- Checkout cancel:
  `{PUBLIC_API_URL}/api/v1/billing/checkout/cancel`
- Billing portal return:
  `{PUBLIC_API_URL}/api/v1/billing/portal/return`
- Webhook endpoint:
  `{PUBLIC_API_URL}/api/v1/stripe/webhook`

With ngrok, keep the tunnel running and update `PUBLIC_API_URL` whenever the free-tier hostname changes. The webhook endpoint in the Stripe Dashboard (or the `stripe listen` command) must point to the current hostname.

Live keys (`sk_live_…` / `rk_live_…`) are refused in `local` and `testing` unless `STRIPE_ALLOW_LIVE=true`.

## Stripe CLI

```bash
stripe login
stripe listen --forward-to http://multi-tenant-plog.test/api/v1/stripe/webhook
```

For ngrok:

```bash
stripe listen --forward-to https://your-ngrok-subdomain.ngrok-free.app/api/v1/stripe/webhook
```

Copy the `whsec_…` value printed by the CLI into `STRIPE_WEBHOOK_SECRET` when using the CLI. If you create a Dashboard webhook endpoint instead, copy that endpoint's signing secret.

## Plan setup

```bash
php artisan db:seed --class=PlanSeeder
php artisan stripe:sync-plans
```

`PlanSeeder` creates/updates the two plans from `config/plans.php`.

`stripe:sync-plans` is idempotent:

- creates a Stripe Product when `stripe_product_id` is missing;
- creates a Stripe Price when `stripe_price_id` is missing;
- otherwise retrieves the existing Price and refreshes local amount, currency, and interval.

## API endpoints

### Tenant

All tenant billing routes require `billing.view` or `billing.manage`. The admin `*` preset covers both.

| Method | Path                           | Permission       | Purpose                                        |
| ------ | ------------------------------ | ---------------- | ---------------------------------------------- |
| `GET`  | `/api/v1/billing/plans`        | `billing.view`   | Active plans                                   |
| `GET`  | `/api/v1/billing/subscription` | `billing.view`   | Current subscription + plan limits             |
| `GET`  | `/api/v1/billing/invoices`     | `billing.view`   | Tenant invoices, filter `status`, `from`, `to` |
| `GET`  | `/api/v1/billing/payments`     | `billing.view`   | Tenant payments, filter `status`, `from`, `to` |
| `POST` | `/api/v1/billing/checkout`     | `billing.manage` | Create a hosted Checkout Session               |
| `POST` | `/api/v1/billing/portal`       | `billing.manage` | Create a Customer Portal session               |
| `POST` | `/api/v1/billing/cancel`       | `billing.manage` | Cancel at period end                           |

Checkout request:

```json
{ "plan_id": 1 }
```

Checkout response:

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_..."
}
```

Frontend:

```ts
const response = await fetch('/api/v1/billing/checkout', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrfToken,
  },
  body: JSON.stringify({ plan_id: 1 }),
});

const data = await response.json();
window.location.assign(data.checkout_url);
```

The backend never accepts an amount, currency, or Stripe price ID from the client.

### Owner

| Method             | Path                                 | Purpose                                                                    |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------- |
| `GET/POST`         | `/api/v1/owner/plans`                | List/create plans                                                          |
| `GET/PATCH/DELETE` | `/api/v1/owner/plans/{plan}`         | Show/update/delete a plan                                                  |
| `GET`              | `/api/v1/owner/billing/transactions` | Payments across tenants, filter `tenant_id`, `status`, `from`, `to`        |
| `GET`              | `/api/v1/owner/billing/metrics`      | MRR/ARR, counts, revenue, refunds, failures, disputes, churn, distribution |

Deleting a plan with subscriptions returns `409`.

## Payment due state

`tenants.is_due` is a boolean flag controlled by Stripe events:

- set to `true` for subscription statuses `past_due`, `unpaid`, and `incomplete`, or when an invoice payment fails;
- set back to `false` when the subscription becomes `active`/`trialing` or an invoice is paid.

The flag is returned in:

- `GET /api/v1/auth/me` → `data.tenant.is_due`
- `GET /api/v1/tenant` → `data.is_due`
- owner tenant responses → `data.is_due`

When `is_due` is `true`, the frontend should block the rest of the tenant UI and show only the billing tab. The backend does **not** schedule the tenant for deletion, soft-delete it, or purge it because of this flag. Tenant deletion remains an explicit owner action, and `tenants:purge` only touches tenants that are already soft-deleted for more than 30 days.

## Return redirects

Stripe redirects the browser back to the API. The API redirects to the tenant frontend:

| Stripe return    | API redirect                                     |
| ---------------- | ------------------------------------------------ |
| Checkout success | `{TENANT_FRONTEND_URL}/billing?status=success`   |
| Checkout cancel  | `{TENANT_FRONTEND_URL}/billing?status=cancelled` |
| Portal return    | `{TENANT_FRONTEND_URL}/billing?status=portal`    |

These are top-level browser navigations, so a `302` is correct here. Normal API JSON endpoints still never issue redirects.

Subscription fulfillment is driven by **webhooks**, not the success page. A user can pay and close the browser before the success redirect.

## Webhook

```http
POST /api/v1/stripe/webhook
```

- CSRF-exempt (it is outside the `web` middleware group).
- Requires a valid `Stripe-Signature`.
- Stores every event in `stripe_webhook_events` with a unique `stripe_event_id`.
- Processes each event once; duplicates return `200` with `"duplicate": true`.
- Unknown event types are recorded and marked processed.
- A processing failure rolls back the transaction and leaves `processed_at` null so Stripe can retry.

Handled events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.created`
- `invoice.finalized`
- `invoice.paid`
- `invoice.voided`
- `invoice.payment_failed`
- `charge.succeeded`
- `charge.failed`
- `charge.refunded`
- `charge.dispute.created`

## Local mirror

| Stripe object   | Local table             | Notes                                                 |
| --------------- | ----------------------- | ----------------------------------------------------- |
| Product / Price | `plans`                 | Global plan catalog                                   |
| Subscription    | `subscriptions`         | One row per tenant, unique `tenant_id`                |
| Invoice         | `billing_invoices`      | Unique `stripe_invoice_id`                            |
| Charge          | `billing_payments`      | Unique `stripe_charge_id`, `stripe_payment_intent_id` |
| Webhook event   | `stripe_webhook_events` | Unique `stripe_event_id`, idempotency log             |

The tenant is resolved through Stripe's object graph:

1. `stripe_subscription_id` → `subscriptions.tenant_id`
2. `stripe_customer_id` → `tenants.stripe_customer_id`
3. subscription metadata `tenant_id` as a fallback

Metadata is not the primary mapping.

## Backfill and reconciliation

```bash
php artisan stripe:sync-billing
php artisan stripe:sync-billing --tenant=1
php artisan stripe:sync-billing --tenant=1 --since=2026-01-01
```

The command pages through Stripe subscriptions, invoices, and charges for tenants with a `stripe_customer_id`, then upserts the local mirror. It is safe to rerun.

Use it:

- after enabling webhooks on an existing Stripe account;
- after a tunnel/secret outage;
- when reconciling local data with Stripe;
- after a bulk plan change.

## Metrics definitions

`GET /api/v1/owner/billing/metrics` accepts `from` and `to`. Defaults are the last 12 months through now, so the response is chart-ready out of the box.

- **MRR** — sum of monthly-normalized plan amounts for `active` and `trialing` subscriptions. Yearly plans are divided by 12.
- **ARR** — MRR × 12.
- **Subscriptions** — counts for `active`, `trialing`, `past_due`, `canceled`, and total.
- **Gross revenue** — sum of collected payments (`succeeded`, `partially_refunded`, `refunded`) in the range. Disputed payments are counted separately.
- **Refunds** — sum of `amount_refunded` on collected payments.
- **Net revenue** — gross − refunds.
- **Failed payments** — count of payments with `failed`.
- **Disputes** — count of payments with `disputed`.
- **Payment status counts** — counts keyed by payment status for pie/bar charts.
- **Churn rate** — canceled / total subscriptions × 100.
- **Plan distribution** — active/trialing subscriptions grouped by plan, with count and MRR.
- **Revenue by tenant** — collected payments grouped by tenant in the range.
- **Timeline** — one entry per month with `period` (`2026-05`), `label` (`May 2026`), `timestamp`, `gross`, `refunds`, `net`, `payments`, `failed_payments`, and `disputes`.

Chart.js example mapping:

```js
const timeline = data.timeline;

const labels = timeline.map((item) => item.label);
const netRevenue = timeline.map((item) => item.net);
const failedPayments = timeline.map((item) => item.failed_payments);
const disputes = timeline.map((item) => item.disputes);
```

Amounts are in the smallest currency unit (cents), as Stripe returns them.

Stripe Dashboard metrics are not a public API, so MRR, ARR, churn, and revenue are computed from the local mirror.

## Tax

Stripe Tax is not enabled in this implementation. If you charge US or EU customers, review [Stripe Tax for recurring payments](https://docs.stripe.com/billing/taxes/collect-taxes.md) and add an active registration before enabling `automatic_tax`; otherwise Stripe calculates and collects no tax while the integration looks correct.
