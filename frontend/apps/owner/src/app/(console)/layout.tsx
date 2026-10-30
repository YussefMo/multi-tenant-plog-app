import { Outlet } from 'react-router-dom';
import ConsoleLayout from '@/layout/ConsoleLayout';
import RequireOwner from '@/layout/RequireOwner';

export default function ConsoleRouteLayout() {
  return (
    <RequireOwner>
      <ConsoleLayout>
        <Outlet />
      </ConsoleLayout>
    </RequireOwner>
  );
}
