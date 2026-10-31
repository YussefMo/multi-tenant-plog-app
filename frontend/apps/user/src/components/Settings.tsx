import PageHeader from '@/components/PageHeader';
import AppearanceCard from '@/components/settings/AppearanceCard';
import PasswordCard from '@/components/settings/PasswordCard';
import ProfileCard from '@/components/settings/ProfileCard';

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your viewer account and app appearance." />

      <div className="grid gap-4 xl:grid-cols-2">
        <ProfileCard />
        <PasswordCard />
        <AppearanceCard />
      </div>
    </div>
  );
}
