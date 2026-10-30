import { LifeBuoy, Pencil } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import TenantAdminCard from '@/components/tenant/TenantAdminCard';
import TenantDangerZone from '@/components/tenant/TenantDangerZone';
import TenantInvitationCard from '@/components/tenant/TenantInvitationCard';
import TenantSubscriptionCard from '@/components/tenant/TenantSubscriptionCard';
import TenantSummaryCard from '@/components/tenant/TenantSummaryCard';
import TenantSupportCard from '@/components/tenant/TenantSupportCard';
import { formatDateTime } from '@/lib/format';
import {
  useDeleteTenant,
  useForceDeleteTenant,
  useRestoreTenant,
  useSupportAccess,
  useTenant,
} from '@/lib/hooks/tenant.hook';

export default function Tenant() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const tenantQuery = useTenant(tenantId);
  const supportAccess = useSupportAccess();
  const deleteTenant = useDeleteTenant();
  const restoreTenant = useRestoreTenant();
  const forceDeleteTenant = useForceDeleteTenant();

  if (tenantQuery.isLoading) {
    return <Spinner />;
  }

  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <ErrorPanel
        error={tenantQuery.error ?? new Error('Tenant not found.')}
        onRetry={() => void tenantQuery.refetch()}
      />
    );
  }

  const tenant = tenantQuery.data;
  const isTrashed = Boolean(tenant.deleted_at);

  const openSupport = () => {
    supportAccess.mutate(tenant.id, {
      onSuccess: (result) => {
        window.open(result.redirect_url, '_blank', 'noopener,noreferrer');
        notify.success('Support session opened.', {
          description: `Expires ${formatDateTime(result.expires_at)}.`,
        });
      },
      onError: (error) => notify.apiError(error, 'Unable to open support access.'),
    });
  };

  const remove = () => {
    deleteTenant.mutate(tenant.id, {
      onSuccess: () => {
        notify.success('Tenant moved to deleted.');
        navigate('/tenants');
      },
      onError: (error) => notify.apiError(error, 'Unable to delete tenant.'),
    });
  };

  const restore = () => {
    restoreTenant.mutate(tenant.id, {
      onSuccess: () => notify.success('Tenant restored.'),
      onError: (error) => notify.apiError(error, 'Unable to restore tenant.'),
    });
  };

  const purge = () => {
    forceDeleteTenant.mutate(tenant.id, {
      onSuccess: () => {
        notify.success('Tenant permanently deleted.');
        navigate('/tenants?state=purged');
      },
      onError: (error) => notify.apiError(error, 'Unable to purge tenant.'),
    });
  };

  return (
    <div>
      <PageHeader
        title={tenant.name}
        description={`Tenant #${tenant.id}${tenant.category ? ` · ${tenant.category}` : ''}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to={`/tenants/${tenant.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
            <Button
              type="button"
              disabled={!tenant.allow_support || isTrashed || supportAccess.isPending}
              onClick={openSupport}
            >
              <LifeBuoy className="size-4" />
              Support
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <TenantSummaryCard tenant={tenant} />
        <TenantAdminCard admin={tenant.admin} />
        <TenantInvitationCard invitation={tenant.invitation} />
        <TenantSubscriptionCard subscription={tenant.subscription} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TenantSupportCard
          tenant={tenant}
          onOpenSupport={openSupport}
          isPending={supportAccess.isPending}
        />
        <TenantDangerZone
          tenant={tenant}
          onDelete={remove}
          onRestore={restore}
          onForceDelete={purge}
          isDeleting={deleteTenant.isPending}
          isRestoring={restoreTenant.isPending}
          isPurging={forceDeleteTenant.isPending}
        />
      </div>
    </div>
  );
}
