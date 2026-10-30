import { Link } from 'react-router-dom';
import { usePathname } from '@shared/lib/router';
import { cn } from '@shared/lib/utils';

export interface TabNavItem {
  title: string;
  url: string;
}

interface TabsNavProps {
  data: TabNavItem[];
  isActive?: (url: string, pathname: string) => boolean;
  ariaLabel?: string;
  className?: string;
}

export default function TabsNav({
  data,
  isActive = (url, pathname) => url === pathname,
  ariaLabel = 'Tabs',
  className,
}: TabsNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn('flex min-w-0 overflow-x-auto', className)}>
      <nav className="flex w-max gap-1" aria-label={ariaLabel}>
        {data.map((tab) => {
          const active = isActive(tab.url, pathname);

          return (
            <Link
              key={tab.url}
              to={tab.url}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              {tab.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
