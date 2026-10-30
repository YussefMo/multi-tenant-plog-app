import { AlertTriangle, Info } from 'lucide-react';
import type { ReactNode } from 'react';

export function UsageRow({ label, effect }: { label: string; effect: string }) {
  return (
    <div className="flex items-baseline gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">→ {effect}</span>
    </div>
  );
}

export function DangerCallout({ children }: { children: ReactNode }) {
  return (
    <div className="border-destructive/30 bg-destructive/10 flex items-start gap-2.5 rounded-xl border p-3">
      <AlertTriangle className="text-destructive mt-px size-4 shrink-0" />
      <p className="text-destructive text-xs leading-relaxed">{children}</p>
    </div>
  );
}

export function InfoCallout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/60 flex items-start gap-2.5 rounded-xl border p-3">
      <Info className="text-muted-foreground mt-px size-4 shrink-0" />
      <p className="text-muted-foreground text-xs leading-relaxed">{children}</p>
    </div>
  );
}
