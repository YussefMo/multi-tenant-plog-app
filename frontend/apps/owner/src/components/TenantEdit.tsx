import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import TenantForm from '@/components/tenant/TenantForm';
import { useTenant, useUpdateTenant } from '@/lib/hooks/tenant.hook';
import type { CreateTenantPayload, UpdateTenantPayload } from '@/lib/types/tenant.type';

function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.errors).map(([field, messages]) => [
      field,
      messages[0] ?? 'Invalid value.',
    ]),
  );
}

export default function TenantEdit() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const tenantQuery = useTenant(tenantId);
  const updateTenant = useUpdateTenant(tenantId ?? '');

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

  const submit = (payload: CreateTenantPayload | UpdateTenantPayload) => {
    updateTenant.mutate(payload as UpdateTenantPayload, {
      onSuccess: () => {
        notify.success('Tenant updated.');
        navigate(`/tenants/${tenant.id}`);
      },
      onError: (error) => notify.apiError(error, 'Unable to update tenant.'),
    });
  };

  return (
    <div>
      <PageHeader title="Edit tenant" description={`Update ${tenant.name}.`} />
      <TenantForm
        mode="edit"
        initialValues={{ name: tenant.name, category: tenant.category ?? '' }}
        onSubmit={submit}
        isPending={updateTenant.isPending}
        errors={fieldErrors(updateTenant.error)}
      />
    </div>
  );
}
