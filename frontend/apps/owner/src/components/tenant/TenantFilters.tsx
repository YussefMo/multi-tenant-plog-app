import { FilterSelect, SearchField } from '@multi-tenant-plog/shared/components/components-parts';
import { cn } from '@multi-tenant-plog/shared/lib/utils';

export type TenantUiState = 'active' | 'trashed' | 'purged';

const tabs: { value: TenantUiState; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'trashed', label: 'Deleted' },
  { value: 'purged', label: 'Permanently deleted' },
];

interface TenantFiltersProps {
  state: TenantUiState;
  onStateChange: (state: TenantUiState) => void;
}

export default function TenantFilters({ state, onStateChange }: TenantFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="bg-muted inline-flex flex-wrap gap-1 rounded-lg p-1" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={state === tab.value}
            onClick={() => onStateChange(tab.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              state === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state !== 'purged' ? (
        <div className="flex flex-wrap items-center gap-2">
          <SearchField placeholder="Search tenants…" />
          <SearchField placeholder="Category" paramKey="category" className="max-w-40" />
          <FilterSelect
            paramKey="allow_support"
            placeholder="All support"
            options={[
              { value: '1', label: 'Enabled' },
              { value: '0', label: 'Disabled' },
            ]}
          />
          <FilterSelect
            paramKey="is_due"
            placeholder="All due"
            options={[
              { value: '1', label: 'Due' },
              { value: '0', label: 'Not due' },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
