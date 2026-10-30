import type { CommandRecord } from '@/types';

export const commands: CommandRecord[] = [
  {
    name: 'owner:create',
    signature: 'php artisan owner:create {--name=} {--email=} {--password=}',
    file: 'app/Console/Commands/OwnerCreateCommand.php',
    purpose: 'Create an active software owner on the separate owner database connection.',
    tone: 'amber',
    options: [
      { flag: '--name', description: 'Owner display name. Prompted when omitted.' },
      { flag: '--email', description: 'Unique owner email. Prompted when omitted.' },
      {
        flag: '--password',
        description: 'Plain password, hashed by the model cast. Prompted secretly when omitted.',
      },
    ],
    reads: ['owners (email uniqueness check)'],
    writes: [
      {
        table: 'owners',
        operation: 'insert',
        detail: 'name, email, hashed password, is_active = true.',
      },
    ],
    external: [],
    idempotent: false,
    output: ['Owner created: {email}', 'Validation errors and a failure exit code.'],
    notes:
      'Refuses duplicate emails. There is no HTTP endpoint for owner creation, so this is the bootstrap path for a new environment.',
  },
  {
    name: 'permissions:sync',
    signature: 'php artisan permissions:sync {--tenant=} {--user=}',
    file: 'app/Console/Commands/SyncPermissionsCommand.php',
    purpose: 'Repair materialized permissions after a manual edit or failed deployment.',
    tone: 'amber',
    options: [
      { flag: '--user', description: 'Sync exactly one user by ID.' },
      { flag: '--tenant', description: 'Sync every user in one tenant.' },
    ],
    reads: ['users', 'permission_profiles', 'config/permissions.php presets'],
    writes: [
      {
        table: 'users',
        operation: 'update',
        detail: 'permissions JSON recomputed as role ∪ profile ∪ extras.',
      },
    ],
    external: [],
    idempotent: true,
    output: ['Synced {user}.', 'Synced {count} users.'],
    notes:
      'With no options it walks every user in chunks of 100. Support users are forced to ["*"] by the sync service.',
  },
  {
    name: 'tenants:purge',
    signature: 'php artisan tenants:purge {--days=30}',
    file: 'app/Console/Commands/PurgeTenantsCommand.php',
    purpose:
      'Permanently remove tenants soft-deleted beyond the retention window and all related rows.',
    tone: 'red',
    options: [
      {
        flag: '--days',
        description: 'Retention window after deleted_at. Default 30; 0 purges immediately.',
      },
    ],
    reads: ['tenants (onlyTrashed)', 'users', 'posts', 'billing mirrors'],
    writes: [
      { table: 'sessions', operation: 'delete', detail: 'Sessions belonging to tenant users.' },
      {
        table: 'password_reset_tokens',
        operation: 'delete',
        detail: 'Reset tokens for tenant emails.',
      },
      { table: 'tenant_support_accesses', operation: 'delete', detail: 'Audit rows.' },
      { table: 'tenant_support_tickets', operation: 'delete', detail: 'Support tickets.' },
      { table: 'tenant_invitations', operation: 'delete', detail: 'Invitations.' },
      { table: 'posts', operation: 'delete', detail: 'Force delete, including trashed posts.' },
      { table: 'billing_invoices', operation: 'delete', detail: 'Invoice mirror.' },
      { table: 'billing_payments', operation: 'delete', detail: 'Payment mirror.' },
      { table: 'subscriptions', operation: 'delete', detail: 'Subscription row.' },
      { table: 'users', operation: 'delete', detail: 'All tenant users, including support users.' },
      { table: 'permission_profiles', operation: 'delete', detail: 'Profiles.' },
      { table: 'tenants', operation: 'delete', detail: 'Force delete the tenant row.' },
    ],
    external: [],
    schedule:
      'Daily at midnight via routes/console.php (Schedule::command("tenants:purge")->daily()).',
    idempotent: true,
    output: ['Purged tenant {id}.', 'Purged {count} tenant(s).'],
    notes:
      'is_due is unrelated to retention. Only deleted_at starts the clock. The whole purge for one tenant is a single transaction.',
  },
  {
    name: 'stripe:sync-plans',
    signature: 'php artisan stripe:sync-plans',
    file: 'app/Console/Commands/StripeSyncPlansCommand.php',
    purpose: 'Create or refresh Stripe products and prices for the plans in config/plans.php.',
    tone: 'green',
    options: [],
    reads: ['plans', 'config/plans.php'],
    writes: [
      {
        table: 'plans',
        operation: 'upsert',
        detail: 'name, amount, currency, interval, product ID, price ID.',
      },
    ],
    external: ['Stripe products.retrieve/create', 'Stripe prices.retrieve/create'],
    idempotent: true,
    output: ['Synced {plan name} ({price id}).'],
    notes:
      'Existing price IDs are retrieved instead of recreated. Plans without a price get a product and price. StripeGateway blocks live keys unless explicitly allowed.',
  },
  {
    name: 'stripe:sync-billing',
    signature: 'php artisan stripe:sync-billing {--tenant=} {--since=}',
    file: 'app/Console/Commands/StripeSyncBillingCommand.php',
    purpose: 'Backfill subscriptions, invoices, and payments from Stripe into the local mirror.',
    tone: 'green',
    options: [
      { flag: '--tenant', description: 'Limit the backfill to one tenant ID.' },
      {
        flag: '--since',
        description: 'Only Stripe objects created on or after this date or Unix timestamp.',
      },
    ],
    reads: ['tenants with a Stripe customer', 'subscriptions'],
    writes: [
      {
        table: 'subscriptions',
        operation: 'upsert',
        detail: 'One row per tenant from Stripe subscriptions.',
      },
      { table: 'tenants', operation: 'update', detail: 'stripe_customer_id and is_due.' },
      {
        table: 'billing_invoices',
        operation: 'upsert',
        detail: 'Invoices from the Stripe list API.',
      },
      {
        table: 'billing_payments',
        operation: 'upsert',
        detail: 'Charges from the Stripe list API.',
      },
    ],
    external: ['Stripe subscriptions.list', 'Stripe invoices.list', 'Stripe charges.list'],
    idempotent: true,
    output: ['Tenant {id}: {n} subscription(s), {n} invoice(s), {n} payment(s).'],
    notes:
      'Useful after downtime or when a webhook endpoint was misconfigured. Every write is an upsert keyed by Stripe ID.',
  },
];

export const commandsByName = new Map(commands.map((command) => [command.name, command]));

export interface ScheduleRecord {
  id: string;
  command: string;
  expression: string;
  cadence: string;
  purpose: string;
  file: string;
  effects: string[];
}

export const schedules: ScheduleRecord[] = [
  {
    id: 'tenant-purge',
    command: 'tenants:purge',
    expression: 'daily()',
    cadence: 'Once per day at midnight',
    purpose: 'Permanently remove tenants deleted beyond the 30-day retention window.',
    file: 'routes/console.php',
    effects: [
      'Reads only trashed tenants older than the retention window.',
      'Deletes sessions, reset tokens, support rows, invitations, posts, billing mirrors, subscriptions, users, profiles, then the tenant.',
      'Runs in one transaction per tenant.',
    ],
  },
];
