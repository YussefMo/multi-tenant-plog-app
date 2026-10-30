import { cn } from '@shared/lib/utils';

interface VerifiedBadgeProps {
  isVerified?: boolean | number | null;
  verifiedLabel?: string;
  pendingLabel?: string;
  className?: string;
}

export default function VerifiedBadge({
  isVerified,
  verifiedLabel = 'Verified',
  pendingLabel = 'Pending',
  className,
}: VerifiedBadgeProps) {
  const verified = Boolean(isVerified);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        verified
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        className,
      )}
    >
      {verified ? verifiedLabel : pendingLabel}
    </span>
  );
}
