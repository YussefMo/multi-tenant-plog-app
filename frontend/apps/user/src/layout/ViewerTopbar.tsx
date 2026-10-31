import { Compass, LogOut, Settings, UserRound } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
import { cn } from '@multi-tenant-plog/shared/lib/utils';
import { useViewerLogout, useViewerMe } from '@/lib/hooks/auth.hook';
import MobileNav from '@/layout/MobileNav';

const navigation = [
  { href: '/', label: 'Discover' },
  { href: '/posts', label: 'Latest posts' },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ViewerTopbar() {
  const navigate = useNavigate();
  const { data: user } = useViewerMe();
  const logout = useViewerLogout();

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

      <Link to="/" className="flex items-center gap-2 font-semibold">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <Compass className="size-4" aria-hidden />
        </span>
        <span className="hidden sm:inline">Discover</span>
      </Link>

      <nav className="ms-4 hidden items-center gap-1 md:flex" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <ThemeToggle compact />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Account menu">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-xs font-semibold">
              {user ? initials(user.name) : <UserRound className="size-4" />}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium">{user?.name ?? 'Viewer'}</p>
            <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <Settings className="me-2 size-4" />
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
