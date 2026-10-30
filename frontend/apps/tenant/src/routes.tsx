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
        children: [
          { path: 'login', lazy: page(() => import('@/app/(auth)/login/page')) },
          {
            path: 'accept-invitation',
            lazy: page(() => import('@/app/(auth)/accept-invitation/page')),
          },
          {
            path: 'support/accept',
            lazy: page(() => import('@/app/(auth)/support/accept/page')),
          },
        ],
      },
      {
        lazy: page(() => import('@/app/(console)/layout')),
        children: [
          { index: true, lazy: page(() => import('@/app/(console)/page')) },
          { path: 'posts', lazy: page(() => import('@/app/(console)/posts/page')) },
          { path: 'posts/new', lazy: page(() => import('@/app/(console)/posts/new/page')) },
          {
            path: 'posts/:postId',
            lazy: page(() => import('@/app/(console)/posts/[postId]/page')),
          },
          {
            path: 'posts/:postId/edit',
            lazy: page(() => import('@/app/(console)/posts/[postId]/edit/page')),
          },
          { path: 'users', lazy: page(() => import('@/app/(console)/users/page')) },
          { path: 'users/new', lazy: page(() => import('@/app/(console)/users/new/page')) },
          {
            path: 'users/:userId',
            lazy: page(() => import('@/app/(console)/users/[userId]/page')),
          },
          {
            path: 'users/:userId/edit',
            lazy: page(() => import('@/app/(console)/users/[userId]/edit/page')),
          },
          { path: 'profiles', lazy: page(() => import('@/app/(console)/profiles/page')) },
          { path: 'profiles/new', lazy: page(() => import('@/app/(console)/profiles/new/page')) },
          {
            path: 'profiles/:profileId/edit',
            lazy: page(() => import('@/app/(console)/profiles/[profileId]/edit/page')),
          },
          { path: 'billing', lazy: page(() => import('@/app/(console)/billing/page')) },
          {
            path: 'billing/plans',
            lazy: page(() => import('@/app/(console)/billing/plans/page')),
          },
          {
            path: 'billing/invoices',
            lazy: page(() => import('@/app/(console)/billing/invoices/page')),
          },
          {
            path: 'billing/payments',
            lazy: page(() => import('@/app/(console)/billing/payments/page')),
          },
          { path: 'settings', lazy: page(() => import('@/app/(console)/settings/page')) },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
];

export const router = createBrowserRouter(routes);
