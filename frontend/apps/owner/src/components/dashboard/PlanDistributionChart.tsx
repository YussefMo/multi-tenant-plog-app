import { Cell, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@multi-tenant-plog/shared/ui/chart';
import type { PlanDistributionEntry } from '@/lib/types/billing.type';

const config = {
  count: { label: 'Subscriptions' },
  plan0: { label: 'No plan', color: 'var(--chart-1)' },
  plan1: { label: 'Plan 1', color: 'var(--chart-2)' },
  plan2: { label: 'Plan 2', color: 'var(--chart-3)' },
  plan3: { label: 'Plan 3', color: 'var(--chart-4)' },
  plan4: { label: 'Plan 4', color: 'var(--chart-5)' },
} satisfies ChartConfig;

interface PlanDistributionChartProps {
  entries: PlanDistributionEntry[];
}

export default function PlanDistributionChart({ entries }: PlanDistributionChartProps) {
  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
        No active subscriptions.
      </div>
    );
  }

  const data = entries.map((entry, index) => ({
    ...entry,
    name: entry.plan ?? 'No plan',
    fill: `var(--chart-${(index % 5) + 1})`,
  }));

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={55} outerRadius={90}>
          {data.map((entry) => (
            <Cell key={`${entry.plan_id ?? 'none'}-${entry.name}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
