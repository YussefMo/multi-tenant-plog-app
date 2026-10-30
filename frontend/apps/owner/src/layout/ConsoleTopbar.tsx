import { LogOut, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@multi-tenant-plog/shared/ui/dropdown-menu';
import { ThemeToggle } from '@multi-tenant-plog/shared/ui/theme-toggle';
import { useOwnerLogout, useOwnerMe } from '@/lib/hooks/auth.hook';
import MobileNav from '@/layout/MobileNav';

function pageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/tenants/new')) return 'Create tenant';
  if (/^\/tenants\/[^/]+\/edit$/.test(pathname)) return 'Edit tenant';
  if (/^\/tenants\/[^/]+$/.test(pathname)) return 'Tenant detail';
  if (pathname.startsWith('/tenants')) return 'Tenants';
  if (pathname.startsWith('/plans/new')) return 'Create plan';
  if (/^\/plans\/[^/]+\/edit$/.test(pathname)) return 'Edit plan';
  if (pathname.startsWith('/plans')) return 'Plans';
  if (pathname.startsWith('/billing/transactions')) return 'Transactions';
  if (pathname.startsWith('/billing')) return 'Billing';
  if (pathname.startsWith('/settings')) return 'Settings';

  return 'Owner console';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ConsoleTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: owner } = useOwnerMe();
  const logout = useOwnerLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        notify.success('Signed out.');
        navigate('/login', { replace: true });
      },
      onError: (error) => notify.apiError(error, 'Unable to sign out.'),
    });
  };

  return (
    <header className="bg-background/95 sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
      <MobileNav />

      <h1 className="flex-1 truncate text-base font-semibold">{pageTitle(location.pathname)}</h1>

      <ThemeToggle compact />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Owner menu">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-xs font-semibold">
              {owner ? initials(owner.name) : <UserRound className="size-4" />}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium">{owner?.name ?? 'Owner'}</p>
            <p className="text-muted-foreground truncate text-xs">{owner?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <UserRound className="me-2 size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={logout.isPending}
            onSelect={(event) => {
              event.preventDefault();
              handleLogout();
            }}
          >
            <LogOut className="me-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
