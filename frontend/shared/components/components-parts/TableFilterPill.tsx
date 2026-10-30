import { Filter } from 'lucide-react';
import type { ReactNode } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@shared/ui/dropdown-menu';
import { cn } from '@shared/lib/utils';

interface TableFilterPillProps {
  children: ReactNode;
  activeCount?: number;
  label?: string;
  className?: string;
}

export default function TableFilterPill({
  children,
  activeCount = 0,
  label = 'Filters',
  className,
}: TableFilterPillProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'border-input bg-background hover:bg-accent inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm',
            activeCount > 0 && 'border-primary text-primary',
            className,
          )}
        >
          <Filter className="size-4" />
          <span className="whitespace-nowrap">{label}</span>
          {activeCount > 0 ? <span>({activeCount})</span> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={(event) => event.preventDefault()}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
