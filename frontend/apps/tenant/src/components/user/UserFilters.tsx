import { FilterSelect, SearchField } from '@multi-tenant-plog/shared/components/components-parts';

interface UserFiltersProps {
  profileOptions: { value: string; label: string }[];
}

export default function UserFilters({ profileOptions }: UserFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchField placeholder="Search users…" />
      <FilterSelect
        paramKey="role"
        placeholder="All roles"
        options={[
          { value: 'admin', label: 'Admin' },
          { value: 'author', label: 'Author' },
        ]}
      />
      <FilterSelect
        paramKey="permission_profile_id"
        placeholder="All profiles"
        options={profileOptions}
      />
    </div>
  );
}
