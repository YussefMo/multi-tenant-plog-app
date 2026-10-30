export const ownerKeys = {
  all: ['owner'] as const,
  me: ['owner', 'me'] as const,
  tenants: (params?: unknown) => ['owner', 'tenants', params ?? {}] as const,
  tenant: (id: number | string) => ['owner', 'tenants', String(id)] as const,
  purged: (params?: unknown) => ['owner', 'tenants', 'purged', params ?? {}] as const,
  plans: ['owner', 'plans'] as const,
  plan: (id: number | string) => ['owner', 'plans', String(id)] as const,
  billingMetrics: (params?: unknown) => ['owner', 'billing', 'metrics', params ?? {}] as const,
  transactions: (params?: unknown) => ['owner', 'billing', 'transactions', params ?? {}] as const,
};
