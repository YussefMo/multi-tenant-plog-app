import { FilterSelect } from '@multi-tenant-plog/shared/components/components-parts';
import DateRangeFilter from '@/components/billing/DateRangeFilter';

const statusOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'open', label: 'Open' },
  { value: 'uncollectible', label: 'Uncollectible' },
  { value: 'void', label: 'Void' },
  { value: 'draft', label: 'Draft' },
];

export default function BillingFilters() {
  return (
    <div className="flex flex-wrap items-end gap-3">
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
