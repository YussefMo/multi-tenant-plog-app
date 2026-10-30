import { Plus } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card } from '@multi-tenant-plog/shared/ui/card';
import { TableFooter, TableTally } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import PurgedTenantTable from '@/components/tenant/PurgedTenantTable';
import TenantFilters, { type TenantUiState } from '@/components/tenant/TenantFilters';
import TenantTable from '@/components/tenant/TenantTable';
import { formatDateTime } from '@/lib/format';
import {
  useDeleteTenant,
  useForceDeleteTenant,
  usePurgedTenants,
  useRestoreTenant,
  useSupportAccess,
  useTenants,
} from '@/lib/hooks/tenant.hook';
import type { Tenant, TenantListParams } from '@/lib/types/tenant.type';

function booleanParam(value: string | null): boolean | undefined {
  if (value === '1') return true;
  if (value === '0') return false;

  return undefined;
}

export default function Tenants() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = (searchParams.get('state') ?? 'active') as TenantUiState;
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);

  const params: TenantListParams = {
    state: state === 'active' ? 'active' : 'trashed',
    search: searchParams.get('search') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    allow_support: booleanParam(searchParams.get('allow_support')),
    is_due: booleanParam(searchParams.get('is_due')),
    page,
    per_page: 15,
  };

  const tenantsQuery = useTenants(params, { enabled: state !== 'purged' });
  const purgedQuery = usePurgedTenants({ page }, { enabled: state === 'purged' });

  const deleteTenant = useDeleteTenant();
  const restoreTenant = useRestoreTenant();
  const forceDeleteTenant = useForceDeleteTenant();
  const supportAccess = useSupportAccess();

  const changeState = (next: TenantUiState) => {
    const nextParams = new URLSearchParams(searchParams);

    if (next === 'active') {
      nextParams.delete('state');
    } else {
      nextParams.set('state', next);
    }

    nextParams.delete('page');
    const query = nextParams.toString();
    navigate(query ? `/tenants?${query}` : '/tenants');
  };

  const openSupport = (tenant: Tenant) => {
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

  const removeTenant = (tenant: Tenant) => {
    deleteTenant.mutate(tenant.id, {
      onSuccess: () => notify.success('Tenant moved to deleted.'),
      onError: (error) => notify.apiError(error, 'Unable to delete tenant.'),
    });
  };

  const restore = (tenant: Tenant) => {
    restoreTenant.mutate(tenant.id, {
      onSuccess: () => notify.success('Tenant restored.'),
      onError: (error) => notify.apiError(error, 'Unable to restore tenant.'),
    });
  };

  const purge = (tenant: Tenant) => {
    forceDeleteTenant.mutate(tenant.id, {
      onSuccess: () => notify.success('Tenant permanently deleted.'),
      onError: (error) => notify.apiError(error, 'Unable to purge tenant.'),
    });
  };

  const pendingTenantId = deleteTenant.isPending
    ? deleteTenant.variables
    : restoreTenant.isPending
      ? restoreTenant.variables
      : forceDeleteTenant.isPending
        ? forceDeleteTenant.variables
        : null;
  const normalizedPendingTenantId =
    typeof pendingTenantId === 'number'
      ? pendingTenantId
      : pendingTenantId
        ? Number(pendingTenantId)
        : null;

  const createAction = (
    <Button asChild>
      <Link to="/tenants/new">
        <Plus className="size-4" />
        Create tenant
      </Link>
    </Button>
  );

  if (state === 'purged') {
    const purged = purgedQuery.data;

    return (
      <div>
        <PageHeader
          title="Tenants"
          description="Manage active tenants, recover deleted ones, and review the permanent purge history."
        />

        <Card className="overflow-hidden py-0">
          <div className="border-b p-4">
            <TenantFilters state={state} onStateChange={changeState} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
            <TableTally
              total={purged?.meta.total}
              currentPage={purged?.meta.current_page}
              lastPage={purged?.meta.last_page}
              entity="purged tenants"
            />
          </div>

          <div className="p-4">
            {purgedQuery.isError ? (
              <ErrorPanel error={purgedQuery.error} onRetry={() => void purgedQuery.refetch()} />
            ) : (
              <PurgedTenantTable purges={purged?.data ?? []} isLoading={purgedQuery.isLoading} />
            )}
          </div>

          {purged && purged.meta.last_page > 1 ? (
            <div className="border-t px-4">
              <TableFooter
                totalPages={purged.meta.last_page}
                from={purged.meta.from}
                to={purged.meta.to}
                total={purged.meta.total}
              />
            </div>
          ) : null}
        </Card>
      </div>
    );
  }

  const tenants = tenantsQuery.data;
  const isTrashed = state === 'trashed';

  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Manage active tenants, recover deleted ones, and review the permanent purge history."
        actions={createAction}
      />

      <Card className="overflow-hidden py-0">
        <div className="border-b p-4">
          <TenantFilters state={state} onStateChange={changeState} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <TableTally
            total={tenants?.meta.total}
            currentPage={tenants?.meta.current_page}
            lastPage={tenants?.meta.last_page}
            entity={isTrashed ? 'deleted tenants' : 'tenants'}
            actions={isTrashed ? undefined : createAction}
          />
        </div>

        <div className="p-4">
          {tenantsQuery.isError ? (
            <ErrorPanel error={tenantsQuery.error} onRetry={() => void tenantsQuery.refetch()} />
          ) : (
            <TenantTable
              tenants={tenants?.data ?? []}
              isLoading={tenantsQuery.isLoading}
              mode={isTrashed ? 'trashed' : 'active'}
              emptyAction={isTrashed ? undefined : createAction}
              onSupport={openSupport}
              onDelete={removeTenant}
              onRestore={restore}
              onForceDelete={purge}
              pendingTenantId={normalizedPendingTenantId}
            />
          )}
        </div>

        {tenants && tenants.meta.last_page > 1 ? (
          <div className="border-t px-4">
            <TableFooter
              totalPages={tenants.meta.last_page}
              from={tenants.meta.from}
              to={tenants.meta.to}
              total={tenants.meta.total}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
