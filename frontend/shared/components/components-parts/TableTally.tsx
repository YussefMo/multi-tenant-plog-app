import type { ReactNode } from 'react';
import { Skeleton } from '@shared/ui/skeleton';
import { cn } from '@shared/lib/utils';

interface TableTallyProps {
  total?: number | null;
  currentPage?: number | null;
  lastPage?: number | null;
  entity?: string;
  className?: string;
  actions?: ReactNode;
}

export default function TableTally({
  total,
  currentPage,
  lastPage,
  entity = 'items',
  className,
  actions,
}: TableTallyProps) {
  const loading = total == null;
  const last = Math.max(lastPage ?? 1, 1);
  const current = Math.min(Math.max(currentPage ?? 1, 1), last);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="bg-muted/60 rounded-full px-3 py-1.5 text-xs">
        {loading ? (
          <Skeleton className="h-3 w-20" />
        ) : (
          <>
            <span className="text-primary font-semibold">{total}</span>
            <span className="text-muted-foreground"> {entity}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <div className="bg-muted/60 text-muted-foreground rounded-full px-3 py-1.5 text-xs">
          {loading ? <Skeleton className="h-3 w-12" /> : `Page ${current} of ${last}`}
        </div>
      </div>
    </div>
  );
}
