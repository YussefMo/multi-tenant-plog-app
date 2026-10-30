import { useState } from 'react';
import { ArrowRight, Copy, MailCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@multi-tenant-plog/shared/ui/card';
import PageHeader from '@/components/PageHeader';
import TenantForm from '@/components/tenant/TenantForm';
import { useCreateTenant } from '@/lib/hooks/tenant.hook';
import type {
  CreateTenantPayload,
  CreateTenantResult,
  UpdateTenantPayload,
} from '@/lib/types/tenant.type';

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

export default function TenantCreate() {
  const createTenant = useCreateTenant();
  const [result, setResult] = useState<CreateTenantResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (payload: CreateTenantPayload | UpdateTenantPayload) => {
    setErrors({});
    createTenant.mutate(payload as CreateTenantPayload, {
      onSuccess: (created) => {
        setResult(created);
        notify.success('Tenant created.');
      },
      onError: (error) => {
        setErrors(fieldErrors(error));
        notify.apiError(error, 'Unable to create tenant.');
      },
    });
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      notify.success('Invitation token copied.');
    } catch {
      notify.error('Unable to copy the token.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Create tenant"
        description="Provision a tenant, create its admin user, and send the invitation."
      />

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailCheck className="size-5 text-emerald-500" />
              Tenant provisioned
            </CardTitle>
            <CardDescription>
              {result.data.name} is ready. The admin invitation was created for {result.admin.email}
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.invitation.token ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Local invitation token</p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="bg-muted min-w-0 flex-1 overflow-x-auto rounded-md px-3 py-2 text-xs">
                    {result.invitation.token}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void copyToken(result.invitation.token as string)}
                  >
                    <Copy className="size-4" />
                    Copy
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  This token is only returned in local and testing environments.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                The invitation email was sent to {result.admin.email}.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to={`/tenants/${result.data.id}`}>
                  Open tenant
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/tenants">Back to tenants</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <TenantForm
          mode="create"
          onSubmit={submit}
          isPending={createTenant.isPending}
          errors={errors}
        />
      )}
    </div>
  );
}
