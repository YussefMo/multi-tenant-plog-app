import PageHeader from '@/components/PageHeader';
import AppearanceCard from '@/components/settings/AppearanceCard';
import OwnerPasswordCard from '@/components/settings/OwnerPasswordCard';
import OwnerProfileCard from '@/components/settings/OwnerProfileCard';

export default function Settings() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your owner profile, password, and console appearance."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <OwnerProfileCard />
        <OwnerPasswordCard />
        <AppearanceCard />
      </div>
    </div>
  );
}
