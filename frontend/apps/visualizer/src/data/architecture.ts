import type { Edge, Node } from '@xyflow/react';
import type { ArchitectureNodeData } from '../types';

export const architectureNodes: Node<ArchitectureNodeData, 'blueprint'>[] = [
  {
    id: 'frontends',
    type: 'blueprint',
    position: { x: 0, y: 0 },
    data: {
      label: 'Frontends',
      subtitle: 'owner :3000 · tenant :3001 · user :3002',
      layer: 'client',
      tone: 'cyan',
      purpose:
        'Three separate Vite applications. They only call the API over HTTP and redirect the browser to API-provided URLs.',
      files: ['config/frontends.php', 'config/cors.php', 'docs/frontend-redirects.md'],
    },
  },
  {
    id: 'routes',
    type: 'blueprint',
    position: { x: 280, y: 0 },
    data: {
      label: 'Routes',
      subtitle: '60 API operations · 44 paths',
      layer: 'routing',
      tone: 'cyan',
      purpose:
        'The API surface. Owner, tenant, public, billing, Stripe webhook, and docs routes are registered here.',
      files: ['routes/api.php', 'routes/web.php', 'bootstrap/app.php'],
    },
  },
  {
    id: 'middleware',
    type: 'blueprint',
    position: { x: 560, y: 0 },
    data: {
      label: 'Middleware',
      subtitle: 'realm · CSRF · guards · support · scope',
      layer: 'middleware',
      tone: 'amber',
      purpose:
        'Resolves the session realm before StartSession, forces JSON, guards owner/tenant sessions, rejects inactive tenants, checks support access, and enforces permissions.',
      files: [
        'app/Http/Middleware/ResolveSessionRealm.php',
        'app/Http/Middleware/ForceJsonResponse.php',
        'app/Http/Middleware/EnsurePermission.php',
        'app/Http/Middleware/EnsureTenantActive.php',
        'app/Http/Middleware/EnsureSupportAccess.php',
      ],
    },
  },
  {
    id: 'auth',
    type: 'blueprint',
    position: { x: 560, y: 160 },
    data: {
      label: 'Authentication',
      subtitle: 'owner + tenant session realms',
      layer: 'middleware',
      tone: 'green',
      purpose:
        'Separate owner and tenant guards, cookies, login controllers, and CSRF-token endpoints. Owner routes use auth:owner; tenant routes use auth:web.',
      files: [
        'config/auth.php',
        'config/session.php',
        'app/Http/Controllers/Api/Owner/OwnerAuthController.php',
        'app/Http/Controllers/Api/Tenant/AuthController.php',
      ],
    },
  },
  {
    id: 'permissions',
    type: 'blueprint',
    position: { x: 560, y: 320 },
    data: {
      label: 'Permissions',
      subtitle: 'role ∪ profile ∪ extras → users.permissions',
      layer: 'middleware',
      tone: 'amber',
      purpose:
        'Materialized permissions are recomputed after user/profile writes. Authorization reads the materialized JSON, never the role directly.',
      files: [
        'config/permissions.php',
        'app/Services/PermissionSyncService.php',
        'app/Http/Middleware/EnsurePermission.php',
        'app/Console/Commands/SyncPermissionsCommand.php',
      ],
    },
  },
  {
    id: 'controllers',
    type: 'blueprint',
    position: { x: 840, y: 0 },
    data: {
      label: 'Controllers',
      subtitle: 'owner · tenant · billing · webhook',
      layer: 'controller',
      tone: 'cyan',
      purpose:
        'Thin HTTP orchestration layer. Controllers validate input, authorize actions, delegate to services, and return resources or JSON.',
      files: [
        'app/Http/Controllers/Api/Owner/TenantController.php',
        'app/Http/Controllers/Api/Owner/OwnerAuthController.php',
        'app/Http/Controllers/Api/Tenant/AuthController.php',
        'app/Http/Controllers/Api/Tenant/PostController.php',
        'app/Http/Controllers/Api/Tenant/BillingController.php',
        'app/Http/Controllers/Api/StripeWebhookController.php',
      ],
    },
  },
  {
    id: 'requests',
    type: 'blueprint',
    position: { x: 840, y: 160 },
    data: {
      label: 'Requests & policies',
      subtitle: 'validation · authorization',
      layer: 'request',
      tone: 'amber',
      purpose:
        'FormRequests validate incoming payloads. Policies and AuthorizesPermissions prevent cross-tenant access and permission escalation.',
      files: [
        'app/Http/Requests/Owner/StoreTenantRequest.php',
        'app/Http/Requests/Tenant/StoreUserRequest.php',
        'app/Policies/PostPolicy.php',
        'app/Http/Controllers/Concerns/AuthorizesPermissions.php',
      ],
    },
  },
  {
    id: 'services',
    type: 'blueprint',
    position: { x: 840, y: 320 },
    data: {
      label: 'Services',
      subtitle: 'provisioning · permissions · billing · Stripe',
      layer: 'service',
      tone: 'green',
      purpose:
        'Business logic lives here: tenant provisioning, permission sync, support users, billing sessions, webhook processing, mirror sync, and metrics.',
      files: [
        'app/Services/TenantProvisioningService.php',
        'app/Services/PermissionSyncService.php',
        'app/Services/SupportUserService.php',
        'app/Services/BillingService.php',
        'app/Services/StripeWebhookService.php',
        'app/Services/BillingMetricsService.php',
      ],
    },
  },
  {
    id: 'models',
    type: 'blueprint',
    position: { x: 840, y: 640 },
    data: {
      label: 'Models & scopes',
      subtitle: '13 models · tenant scope · soft deletes',
      layer: 'model',
      tone: 'cyan',
      purpose:
        'Eloquent models define relationships, casts, soft deletes, and tenant scoping. Post queries pass through TenantScope unless a directory explicitly bypasses it.',
      files: [
        'app/Models/Tenant.php',
        'app/Models/User.php',
        'app/Models/Post.php',
        'app/Models/Subscription.php',
        'app/Models/Concerns/BelongsToTenant.php',
        'app/Models/Scopes/TenantScope.php',
      ],
    },
  },
  {
    id: 'appdb',
    type: 'blueprint',
    position: { x: 840, y: 800 },
    data: {
      label: 'Application DB',
      subtitle: 'tenants · users · posts · billing',
      layer: 'database',
      tone: 'amber',
      purpose:
        'Primary MySQL database for tenant data, permissions, posts, support sessions, billing mirror rows, webhook events, and sessions.',
      files: [
        'database/migrations/2026_10_27_121640_create_tenants_table.php',
        'database/migrations/2026_10_28_131911_create_users_table.php',
        'database/migrations/2026_10_28_151006_create_posts_table.php',
        'database/migrations/2026_10_29_062338_create_subscriptions_table.php',
        'database/migrations/2026_10_29_062341_create_billing_payments_table.php',
      ],
    },
  },
  {
    id: 'ownerdb',
    type: 'blueprint',
    position: { x: 840, y: 960 },
    data: {
      label: 'Owner DB',
      subtitle: 'separate connection · owners',
      layer: 'database',
      tone: 'red',
      purpose:
        'Separate MySQL connection for software owners. There is no cross-database foreign key; tenants.owner_id is enforced by owner routes and ensureOwned().',
      files: [
        'database/migrations/owner/2026_10_27_110855_create_owners_table.php',
        'app/Models/Owner.php',
        'app/Http/Controllers/Api/Owner/TenantController.php',
      ],
    },
  },
  {
    id: 'resources',
    type: 'blueprint',
    position: { x: 840, y: 480 },
    data: {
      label: 'Resources',
      subtitle: 'JSON contracts · data wrappers',
      layer: 'resource',
      tone: 'green',
      purpose:
        'API Resources are the stable JSON contract. They hide internal fields, load relationships conditionally, and wrap collection pagination.',
      files: [
        'app/Http/Resources/UserResource.php',
        'app/Http/Resources/TenantResource.php',
        'app/Http/Resources/PostResource.php',
        'app/Http/Resources/SubscriptionResource.php',
        'app/Http/Resources/BillingPaymentResource.php',
      ],
    },
  },
  {
    id: 'commands',
    type: 'blueprint',
    position: { x: 0, y: 200 },
    data: {
      label: 'Commands',
      subtitle: 'purge · sync · seed · owner',
      layer: 'command',
      tone: 'amber',
      purpose:
        'Operational entry points that are not HTTP requests: owner creation, permission repair, tenant purge, Stripe plan/billing sync.',
      files: [
        'app/Console/Commands/OwnerCreateCommand.php',
        'app/Console/Commands/SyncPermissionsCommand.php',
        'app/Console/Commands/PurgeTenantsCommand.php',
        'app/Console/Commands/StripeSyncPlansCommand.php',
        'app/Console/Commands/StripeSyncBillingCommand.php',
      ],
    },
  },
  {
    id: 'scheduler',
    type: 'blueprint',
    position: { x: 0, y: 400 },
    data: {
      label: 'Scheduler',
      subtitle: 'daily tenant purge',
      layer: 'command',
      tone: 'amber',
      purpose:
        'routes/console.php schedules tenants:purge daily. Purge only touches tenants already soft-deleted beyond the retention window.',
      files: ['routes/console.php'],
    },
  },
  {
    id: 'stripe',
    type: 'blueprint',
    position: { x: 280, y: 200 },
    data: {
      label: 'Stripe',
      subtitle: 'checkout · portal · webhooks',
      layer: 'service',
      tone: 'red',
      purpose:
        'Stripe-hosted Checkout and Customer Portal. Webhooks verify signatures, process events idempotently, and update the local mirror.',
      files: [
        'app/Services/StripeGateway.php',
        'app/Services/StripeWebhookService.php',
        'app/Services/SubscriptionSyncService.php',
        'app/Services/BillingMirrorService.php',
        'config/services.php',
      ],
    },
  },
  {
    id: 'docs',
    type: 'blueprint',
    position: { x: 280, y: 400 },
    data: {
      label: 'OpenAPI docs',
      subtitle: 'Scramble · Basic auth · CSRF-aware',
      layer: 'config',
      tone: 'green',
      purpose:
        'Scramble generates OpenAPI 3.1 for all routes. The docs UI automatically fetches the correct CSRF token and sends session cookies.',
      files: [
        'config/scramble.php',
        'app/Providers/ScrambleServiceProvider.php',
        'app/Http/Middleware/ProtectDocsAccess.php',
        'resources/views/vendor/scramble/docs.blade.php',
      ],
    },
  },
];

export const architectureEdges: Edge[] = [
  { id: 'frontends-routes', source: 'frontends', target: 'routes' },
  { id: 'routes-middleware', source: 'routes', target: 'middleware' },
  { id: 'middleware-auth', source: 'middleware', target: 'auth' },
  { id: 'middleware-permissions', source: 'middleware', target: 'permissions' },
  { id: 'middleware-controllers', source: 'middleware', target: 'controllers' },
  { id: 'auth-controllers', source: 'auth', target: 'controllers' },
  { id: 'permissions-controllers', source: 'permissions', target: 'controllers' },
  { id: 'controllers-requests', source: 'controllers', target: 'requests' },
  { id: 'controllers-services', source: 'controllers', target: 'services' },
  { id: 'controllers-resources', source: 'controllers', target: 'resources' },
  { id: 'services-models', source: 'services', target: 'models' },
  { id: 'models-appdb', source: 'models', target: 'appdb' },
  { id: 'models-ownerdb', source: 'models', target: 'ownerdb' },
  { id: 'resources-frontends', source: 'resources', target: 'frontends' },
  { id: 'commands-services', source: 'commands', target: 'services' },
  { id: 'scheduler-commands', source: 'scheduler', target: 'commands' },
  { id: 'stripe-controllers', source: 'stripe', target: 'controllers' },
  { id: 'docs-routes', source: 'docs', target: 'routes' },
];
