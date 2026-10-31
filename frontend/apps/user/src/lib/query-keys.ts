export const viewerKeys = {
  all: ['viewer'] as const,
  me: ['viewer', 'me'] as const,
  overview: ['viewer', 'overview'] as const,
  tenants: (params?: unknown) => ['viewer', 'tenants', params ?? {}] as const,
  tenant: (id: number | string) => ['viewer', 'tenants', String(id)] as const,
  tenantPosts: (id: number | string, params?: unknown) =>
    ['viewer', 'tenants', String(id), 'posts', params ?? {}] as const,
  posts: (params?: unknown) => ['viewer', 'posts', params ?? {}] as const,
  post: (id: number | string) => ['viewer', 'posts', String(id)] as const,
};
