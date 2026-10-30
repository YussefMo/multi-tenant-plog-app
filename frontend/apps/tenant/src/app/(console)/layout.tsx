import { Outlet } from 'react-router-dom';
import ConsoleLayout from '@/layout/ConsoleLayout';
import RequireTenantAuth from '@/layout/RequireTenantAuth';

export default function ConsoleRouteLayout() {
  return (
    <RequireTenantAuth>
      <ConsoleLayout>
        <Outlet />
      </ConsoleLayout>
    </RequireTenantAuth>
  );
}
