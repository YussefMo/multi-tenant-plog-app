import type { ReactNode } from 'react';
import { cn } from '@shared/lib/utils';

interface TableToolbarProps {
  search?: ReactNode;
  filter?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function TableToolbar({ search, filter, actions, className }: TableToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 py-2', className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {search}
        {filter}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
