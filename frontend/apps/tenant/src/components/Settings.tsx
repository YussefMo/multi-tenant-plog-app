import PageHeader from '@/components/PageHeader';
import AccountPasswordCard from '@/components/tenant-settings/AccountPasswordCard';
import AccountProfileCard from '@/components/tenant-settings/AccountProfileCard';
import AppearanceCard from '@/components/tenant-settings/AppearanceCard';
import TenantSettingsCard from '@/components/tenant-settings/TenantSettingsCard';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';

export default function Settings() {
  const { data: user } = useTenantMe();
  const canViewTenantSettings = hasPermission(user, 'tenant.settings.view');
  const canUpdateTenantSettings = hasPermission(user, 'tenant.settings.update');

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage tenant settings, your account, and console appearance."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {canViewTenantSettings ? <TenantSettingsCard canUpdate={canUpdateTenantSettings} /> : null}
        <AccountProfileCard />
        <AccountPasswordCard />
        <AppearanceCard />
      </div>
    </div>
  );
}
