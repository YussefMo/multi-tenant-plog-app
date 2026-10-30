import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@multi-tenant-plog/shared/ui/chart';
import { formatCurrency } from '@/lib/format';
import type { TimelineEntry } from '@/lib/types/billing.type';

const config = {
  gross: { label: 'Gross', color: 'var(--chart-1)' },
  refunds: { label: 'Refunds', color: 'var(--chart-4)' },
  net: { label: 'Net', color: 'var(--chart-2)' },
} satisfies ChartConfig;

interface RevenueTimelineChartProps {
  timeline: TimelineEntry[];
  currency?: string;
}

export default function RevenueTimelineChart({
  timeline,
  currency = 'usd',
}: RevenueTimelineChartProps) {
  if (timeline.length === 0) {
    return (
      <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
        No revenue data for this period.
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={(value) => formatCurrency(Number(value), currency)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="gross" fill="var(--color-gross)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="refunds" fill="var(--color-refunds)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="net" fill="var(--color-net)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
