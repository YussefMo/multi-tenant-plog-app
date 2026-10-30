import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@multi-tenant-plog/shared/lib/utils';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';

export interface ConsoleNavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  permission?: string;
}

export const consoleNavItems: ConsoleNavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, end: true },
  { title: 'Posts', href: '/posts', icon: FileText },
  { title: 'Users', href: '/users', icon: Users, permission: 'users.view' },
  { title: 'Profiles', href: '/profiles', icon: ShieldCheck, permission: 'profiles.view' },
  { title: 'Billing', href: '/billing', icon: CreditCard, permission: 'billing.view' },
  { title: 'Settings', href: '/settings', icon: Settings },
];

interface ConsoleSidebarProps {
  onNavigate?: () => void;
}

export default function ConsoleSidebar({ onNavigate }: ConsoleSidebarProps) {
  const { data: user } = useTenantMe();
  const tenantName = user?.tenant?.name ?? 'Tenant Console';

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <Building2 className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">{tenantName}</p>
          <p className="text-muted-foreground text-xs">Tenant Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Tenant console navigation">
        {consoleNavItems
          .filter((item) => !item.permission || hasPermission(user, item.permission))
          .map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )
              }
            >
              <item.icon className="size-4" aria-hidden />
              {item.title}
            </NavLink>
          ))}
      </nav>

      <div className="text-muted-foreground border-t p-4 text-xs">
        <p>tenant_session realm</p>
        <p className="mt-1">API v1</p>
      </div>
    </div>
  );
}
