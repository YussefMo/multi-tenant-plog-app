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
          { path: 'register', lazy: page(() => import('@/app/(auth)/register/page')) },
        ],
      },
      {
        lazy: page(() => import('@/app/(viewer)/layout')),
        children: [
          { index: true, lazy: page(() => import('@/app/(viewer)/page')) },
          {
            path: 'tenants/:tenantId',
            lazy: page(() => import('@/app/(viewer)/tenants/[tenantId]/page')),
          },
          { path: 'posts', lazy: page(() => import('@/app/(viewer)/posts/page')) },
          {
            path: 'posts/:postId',
            lazy: page(() => import('@/app/(viewer)/posts/[postId]/page')),
          },
          { path: 'settings', lazy: page(() => import('@/app/(viewer)/settings/page')) },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
];

export const router = createBrowserRouter(routes);
