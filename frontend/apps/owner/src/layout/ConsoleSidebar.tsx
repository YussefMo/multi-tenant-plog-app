import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@multi-tenant-plog/shared/lib/utils';

export interface ConsoleNavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

export const consoleNavItems: ConsoleNavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, end: true },
  { title: 'Tenants', href: '/tenants', icon: Building2 },
  { title: 'Plans', href: '/plans', icon: CreditCard },
  { title: 'Billing', href: '/billing', icon: BarChart3, end: true },
  { title: 'Transactions', href: '/billing/transactions', icon: ReceiptText },
  { title: 'Settings', href: '/settings', icon: Settings },
];

interface ConsoleSidebarProps {
  onNavigate?: () => void;
}

export default function ConsoleSidebar({ onNavigate }: ConsoleSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Owner Console</p>
          <p className="text-muted-foreground text-xs">Multi Tenant Plog</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Owner console navigation">
        {consoleNavItems.map((item) => (
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
        <p>owner_session realm</p>
        <p className="mt-1">API v1</p>
      </div>
    </div>
  );
}
