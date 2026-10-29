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
      { index: true, lazy: page(() => import('@/app/page')) },
      { path: '*', Component: NotFound },
    ],
  },
];

export const router = createBrowserRouter(routes);
