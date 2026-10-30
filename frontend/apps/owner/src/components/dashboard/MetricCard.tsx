import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@multi-tenant-plog/shared/ui/card';
import { cn } from '@multi-tenant-plog/shared/lib/utils';

type MetricTone = 'default' | 'positive' | 'warning' | 'danger';

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: MetricTone;
}

const toneClasses: Record<MetricTone, string> = {
  default: 'bg-primary/10 text-primary',
  positive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-destructive/10 text-destructive',
};

export default function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: MetricCardProps) {
  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
        </div>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            toneClasses[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
