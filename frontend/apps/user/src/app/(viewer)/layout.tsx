import { Outlet } from 'react-router-dom';
import RequireViewerAuth from '@/layout/RequireViewerAuth';
import ViewerLayout from '@/layout/ViewerLayout';

export default function ViewerRouteLayout() {
  return (
    <RequireViewerAuth>
      <ViewerLayout>
        <Outlet />
      </ViewerLayout>
    </RequireViewerAuth>
  );
}
