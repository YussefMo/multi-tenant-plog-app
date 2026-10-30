import { cn } from '@shared/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  author: 'Author',
  user: 'User',
  viewer: 'Viewer',
  support: 'Support',
};

export function roleLabel(value?: string | null, isSupport = false): string {
  if (isSupport) {
    return ROLE_LABELS.support;
  }

  const normalized = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  return ROLE_LABELS[normalized] ?? value?.trim() ?? 'Unknown';
}

interface RoleBadgeProps {
  value?: string | null;
  isSupport?: boolean;
  className?: string;
}

export default function RoleBadge({ value, isSupport = false, className }: RoleBadgeProps) {
  const normalized = isSupport ? 'support' : (value ?? '').trim().toLowerCase();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        normalized === 'admin' || normalized === 'support'
          ? 'bg-primary/10 text-primary'
          : normalized === 'author'
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
            : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {roleLabel(value, isSupport)}
    </span>
  );
}
