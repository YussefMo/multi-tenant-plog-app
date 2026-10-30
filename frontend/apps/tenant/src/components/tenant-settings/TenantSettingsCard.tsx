import { useEffect, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
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
import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Label } from '@multi-tenant-plog/shared/ui/label';
import { Switch } from '@multi-tenant-plog/shared/ui/switch';
import { useTenant, useUpdateTenant } from '@/lib/hooks/tenant.hook';

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

export default function TenantSettingsCard({ canUpdate }: { canUpdate: boolean }) {
  const tenantQuery = useTenant();
  const updateTenant = useUpdateTenant();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [allowSupport, setAllowSupport] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tenantQuery.data) {
      setName(tenantQuery.data.name);
      setCategory(tenantQuery.data.category ?? '');
      setAllowSupport(tenantQuery.data.allow_support);
    }
  }, [tenantQuery.data]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Tenant name is required.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    updateTenant.mutate(
      {
        name: name.trim(),
        category: category.trim() || null,
        allow_support: allowSupport,
      },
      {
        onSuccess: () => notify.success('Tenant settings updated.'),
        onError: (error) => {
          setErrors(fieldErrors(error));
          notify.apiError(error, 'Unable to update tenant settings.');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant settings</CardTitle>
        <CardDescription>Update the tenant name, category, and support access.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenant-name">Tenant name</Label>
              <Input
                id="tenant-name"
                value={name}
                disabled={!canUpdate}
                aria-invalid={Boolean(errors.name)}
                onChange={(event) => setName(event.target.value)}
              />
              {errors.name ? <p className="text-destructive text-xs">{errors.name}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-category">Category</Label>
              <Input
                id="tenant-category"
                value={category}
                disabled={!canUpdate}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="allow-support"
              checked={allowSupport}
              disabled={!canUpdate}
              onCheckedChange={setAllowSupport}
            />
            <div>
              <Label htmlFor="allow-support" className="font-normal">
                Allow owner support access
              </Label>
              <p className="text-muted-foreground text-xs">
                When enabled, the owner can open a short-lived support session.
              </p>
            </div>
          </div>

          {canUpdate ? (
            <Button type="submit" disabled={updateTenant.isPending}>
              <Save className="size-4" />
              {updateTenant.isPending ? 'Saving…' : 'Save settings'}
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">
              You do not have permission to update tenant settings.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
