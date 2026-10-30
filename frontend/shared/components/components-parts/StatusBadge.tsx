import { cn } from '@shared/lib/utils';

interface StatusBadgeProps {
  isActive?: boolean | number | null;
  archived?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  archivedLabel?: string;
  className?: string;
}

export default function StatusBadge({
  isActive,
  archived = false,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  archivedLabel = 'Archived',
  className,
}: StatusBadgeProps) {
  const active = Boolean(isActive);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        archived
          ? 'bg-muted text-muted-foreground'
          : active
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'bg-destructive/10 text-destructive',
        className,
      )}
    >
      {archived ? archivedLabel : active ? activeLabel : inactiveLabel}
    </span>
  );
}
