import { FilterSelect, SearchField } from '@multi-tenant-plog/shared/components/components-parts';

interface PostFiltersProps {
  authorOptions: { value: string; label: string }[];
  showAuthor: boolean;
}

export default function PostFilters({ authorOptions, showAuthor }: PostFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchField placeholder="Search posts…" />
      <FilterSelect
        paramKey="status"
        placeholder="All statuses"
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' },
        ]}
      />
      {showAuthor ? (
        <FilterSelect paramKey="author_id" placeholder="All authors" options={authorOptions} />
      ) : null}
    </div>
  );
}
