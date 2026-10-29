import type { ComponentType, ReactNode } from 'react';
import { createBrowserRouter, Outlet, ScrollRestoration, type RouteObject } from 'react-router-dom';
import AtlasLayout from '@/app/(atlas)/layout';
import RootLayout from '@/app/layout';
import NotFound from '@/app/not-found';

type Layout = ComponentType<{ children: ReactNode }>;

const withOutlet = (Layout: Layout) =>
  function LayoutRoute() {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  };

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
        Component: withOutlet(AtlasLayout),
        children: [
          { index: true, lazy: page(() => import('@/app/(atlas)/page')) },
          { path: 'requests', lazy: page(() => import('@/app/(atlas)/requests/page')) },
          { path: 'files', lazy: page(() => import('@/app/(atlas)/files/page')) },
          {
            path: 'journeys/:journeyId?/:stepId?',
            lazy: page(() => import('@/app/(atlas)/journeys/[[...slug]]/page')),
          },
          { path: 'models', lazy: page(() => import('@/app/(atlas)/models/page')) },
          { path: 'commands', lazy: page(() => import('@/app/(atlas)/commands/page')) },
        ],
      },
      {
        path: 'present/:collection?/:itemId?/:stepId?',
        lazy: page(() => import('@/app/present/[[...slug]]/page')),
      },
      { path: '*', Component: NotFound },
    ],
  },
];

const basename =
  import.meta.env.BASE_URL === '/' ? '/' : import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(routes, { basename });
