# System Atlas — Stripe Webhook Compatibility Update

> **Status:** planned, not executed.
>
> This covers the Stripe API `2026-09-30.endive` compatibility fixes. The webhook route, models, tables, and command list are unchanged.

## 1. What changed

Stripe moved several invoice/subscription fields:

| Old field                           | New field                                                            |
| ----------------------------------- | -------------------------------------------------------------------- |
| `invoice.subscription`              | `invoice.parent.subscription_details.subscription`                   |
| `invoice.subscription`              | `invoice.lines.data.0.parent.subscription_item_details.subscription` |
| `invoice.amount_due`                | `invoice.amount_remaining` for remaining balance                     |
| `subscription.current_period_start` | `subscription.items.data.0.current_period_start` fallback            |
| `subscription.current_period_end`   | `subscription.items.data.0.current_period_end` fallback              |

Stripe may also send `payment_intent.succeeded` without a separate `charge.succeeded`. The webhook now handles payment intents and retrieves `latest_charge`.

## 2. No new routes, models, tables, or commands

Current counts stay:

```text
70 API operations · 54 unique paths
13 models
6 commands
```

The `/api/v1/stripe/webhook` route is unchanged.

## 3. Files to update in `files.json`

These files already exist in the catalog. Update their purposes:

| File                                       | New purpose                                                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/Services/BillingMirrorService.php`    | Mirrors invoices/payments and resolves subscription IDs from legacy and new Stripe invoice shapes; uses `amount_remaining` for due.            |
| `app/Services/StripeWebhookService.php`    | Handles invoice, subscription, charge, and payment-intent events; syncs subscription on `invoice.paid`; mirrors payments from `latest_charge`. |
| `app/Services/SubscriptionSyncService.php` | Syncs subscriptions and falls back to item-level period dates when top-level dates are absent.                                                 |
| `tests/Feature/StripeWebhookTest.php`      | Covers new invoice parent shape, `amount_remaining`, payment-intent charge mirroring, and item-level period dates.                             |

Also update:

| File                                                | Update                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `app/Console/Commands/StripeSyncBillingCommand.php` | Mention that it repairs subscriptions, invoices, and payments using the new Stripe shapes. |

## 4. Journey `stripe-webhook` updates

Update the existing `stripe-webhook` journey in `src/data/journeys.ts`.

### 4.1 `subscriptions` step

Add:

- Top-level `current_period_start/end` first.
- Fallback to `items.data.0.current_period_start/end`.

Speaker note:

> Newer Stripe subscription payloads may put the billing period on the subscription item.

### 4.2 `invoices` step

Change the summary and speaker notes to include:

- Subscription resolution tries:
  - `subscription`
  - `parent.subscription_details.subscription`
  - `lines.data.0.parent.subscription_item_details.subscription`
- `amount_remaining` is used for `amount_due`, falling back to `amount_due`.
- `invoice.paid` mirrors the invoice, retrieves and syncs the subscription, and clears `is_due`.
- `invoice.payment_failed` mirrors the invoice, syncs the subscription, and sets `is_due = true`.

Replace the old speaker note:

```text
is_due is a convenience flag for the UI; it never deletes or blocks the tenant.
```

with:

```text
is_due now blocks tenant writes through EnsureTenantNotDue; billing and account endpoints stay available.
```

### 4.3 `payments` step

Add `payment_intent.succeeded` and `payment_intent.payment_failed`:

- Read `latest_charge`.
- Retrieve the charge.
- Mirror it through `BillingMirrorService::upsertPayment`.

Keep `charge.succeeded`, `charge.failed`, `charge.refunded`, and `charge.dispute.created`.

### 4.4 Optional new step `payment-intents`

If the journey is kept step-oriented, add a step:

```ts
{
  id: 'payment-intents',
  title: 'Mirror payment intents',
  summary:
    'payment_intent.succeeded/failed read latest_charge, retrieve the charge, and upsert billing_payments.',
  actor: 'StripeWebhookService',
  service: 'StripeWebhookService::handle',
  models: ['BillingPayment'],
  tables: [
    {
      table: 'billing_payments',
      operation: 'upsert',
      detail: 'Charge amount, status, paid_at, and payment intent id.',
    },
  ],
  response: 'Mirrored payment or null.',
  files: [
    'app/Services/StripeWebhookService.php',
    'app/Services/BillingMirrorService.php',
    'app/Services/StripeGateway.php',
    'app/Models/BillingPayment.php',
  ],
  speakerNotes:
    'Stripe can send payment_intent.succeeded without charge.succeeded; retrieve latest_charge to keep the payment mirror complete.',
}
```

### 4.5 Related journeys

Update `tenant-billing-history` to mention:

- Invoice `amount_due` comes from `amount_remaining`.
- Payments may be mirrored from `payment_intent.*`.

Update `tenant-trial-and-due-protection` to cross-link the `is_due` write-blocking behavior.

## 5. Commands

No new command. Update `stripe:sync-billing` notes in `commands.ts`:

```text
Also repairs legacy/new Stripe invoice subscription shapes, amount_remaining, and payment-intent charges.
```

## 6. Architecture map

No new nodes or count changes. Update the `services` node purpose to mention:

```text
Billing mirror, subscription sync, webhook processing, and Stripe API shape compatibility.
```

## 7. README and docs

No count changes:

```text
70 API operations · 54 paths
13 models
6 commands
```

Update the Stripe presentation flow notes:

- `invoice.subscription` → `parent.subscription_details.subscription`
- `amount_remaining`
- `payment_intent.succeeded` → `latest_charge` → payment mirror
- `invoice.paid` syncs the subscription
- subscription period fallback to item dates

## 8. Validation

```bash
pnpm generate:requests
pnpm atlas:validate
pnpm typecheck:frontend
pnpm build:visualizer
```

Browser-smoke:

```text
/journeys/stripe-webhook
/journeys/tenant-billing-history
/requests?path=%2Fapi%2Fv1%2Fstripe%2Fwebhook
```

## 9. Acceptance criteria

- The `stripe-webhook` journey explains the new invoice subscription path.
- `amount_remaining` is documented.
- `payment_intent.succeeded/failed` are represented.
- `invoice.paid` subscription sync is represented.
- Item-level subscription period fallback is documented.
- The due-blocking behavior is corrected in the journey speaker note.
- `pnpm atlas:validate`, `pnpm typecheck:frontend`, and `pnpm build:visualizer` pass.
