import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@multi-tenant-plog/shared/ui/card';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export default function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
