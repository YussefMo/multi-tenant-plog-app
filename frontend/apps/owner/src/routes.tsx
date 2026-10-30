import type { ComponentType } from 'react';
import { createBrowserRouter, Outlet, ScrollRestoration, type RouteObject } from 'react-router-dom';
import RootLayout from '@/app/layout';
import NotFound from '@/app/not-found';

const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

function Root() {
  return (
    <RootLayout>
      <Outlet />
      <ScrollRestoration />
    </RootLayout>
  );
}

const routes: RouteObject[] = [
  {
    Component: Root,
    children: [
      {
        lazy: page(() => import('@/app/(auth)/layout')),
        children: [{ path: 'login', lazy: page(() => import('@/app/(auth)/login/page')) }],
      },
      {
        lazy: page(() => import('@/app/(console)/layout')),
        children: [
          { index: true, lazy: page(() => import('@/app/(console)/page')) },
          { path: 'tenants', lazy: page(() => import('@/app/(console)/tenants/page')) },
          { path: 'tenants/new', lazy: page(() => import('@/app/(console)/tenants/new/page')) },
          {
            path: 'tenants/:tenantId',
            lazy: page(() => import('@/app/(console)/tenants/[tenantId]/page')),
          },
          {
            path: 'tenants/:tenantId/edit',
            lazy: page(() => import('@/app/(console)/tenants/[tenantId]/edit/page')),
          },
          { path: 'plans', lazy: page(() => import('@/app/(console)/plans/page')) },
          { path: 'plans/new', lazy: page(() => import('@/app/(console)/plans/new/page')) },
          {
            path: 'plans/:planId/edit',
            lazy: page(() => import('@/app/(console)/plans/[planId]/edit/page')),
          },
          { path: 'billing', lazy: page(() => import('@/app/(console)/billing/page')) },
          {
            path: 'billing/transactions',
            lazy: page(() => import('@/app/(console)/billing/transactions/page')),
          },
          { path: 'settings', lazy: page(() => import('@/app/(console)/settings/page')) },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
];

export const router = createBrowserRouter(routes);
