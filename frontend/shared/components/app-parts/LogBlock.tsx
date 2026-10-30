import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { notify } from '@shared/lib/toast';
import { cn } from '@shared/lib/utils';

interface LogBlockProps {
  label: string;
  value: string;
  tone?: 'neutral' | 'danger';
  copy?: boolean;
}

export function logBody(value: string | null | undefined): string {
  return value ?? '';
}

export default function LogBlock({ label, value, tone = 'neutral', copy = true }: LogBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const body = logBody(value);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const copyValue = () => {
    void navigator.clipboard?.writeText(body);
    notify.success('Copied');
    setCopied(true);

    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-semibold uppercase">{label}</span>
        {copy ? (
          <button
            type="button"
            onClick={copyValue}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </div>
      <pre
        dir="ltr"
        className={cn(
          'bg-muted/50 max-h-80 overflow-auto rounded-lg border p-3 font-mono text-xs whitespace-pre-wrap',
          tone === 'danger' && 'border-destructive/30 bg-destructive/5 text-destructive',
        )}
      >
        {body}
      </pre>
    </div>
  );
}
