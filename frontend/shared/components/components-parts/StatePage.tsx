import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@shared/lib/utils';

interface StatePageProps {
  icon: LucideIcon;
  tone?: 'info' | 'danger';
  title: string;
  description: string;
  detail?: string | null;
  meta?: string | null;
  actions?: ReactNode;
}

export default function StatePage({
  icon: Icon,
  tone = 'info',
  title,
  description,
  detail,
  meta,
  actions,
}: StatePageProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl border p-7 text-center shadow-sm">
        <div
          className={cn(
            'mx-auto flex size-12 items-center justify-center rounded-full',
            tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="size-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        {detail ? (
          <pre className="bg-muted text-muted-foreground mt-4 overflow-auto rounded-lg px-3.5 py-3 text-start font-mono text-xs break-all whitespace-pre-wrap">
            {detail}
          </pre>
        ) : null}
        {meta ? <p className="text-muted-foreground mt-2 text-xs">{meta}</p> : null}
        {actions ? (
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
