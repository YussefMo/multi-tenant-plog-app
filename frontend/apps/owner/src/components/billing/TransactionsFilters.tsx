import { FilterSelect } from '@multi-tenant-plog/shared/components/components-parts';
import DateRangeFilter from '@/components/billing/DateRangeFilter';

interface TransactionsFiltersProps {
  tenantOptions: { value: string; label: string }[];
}

const statusOptions = [
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'partially_refunded', label: 'Partially refunded' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
  { value: 'disputed', label: 'Disputed' },
];

export default function TransactionsFilters({ tenantOptions }: TransactionsFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <FilterSelect
        paramKey="tenant_id"
        placeholder="All tenants"
        options={tenantOptions}
        className="w-48"
      />
      <FilterSelect
        paramKey="status"
        placeholder="All statuses"
        options={statusOptions}
        className="w-48"
      />
      <DateRangeFilter />
    </div>
  );
}
