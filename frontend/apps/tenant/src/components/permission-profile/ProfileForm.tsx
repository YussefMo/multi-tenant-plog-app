import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
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
import PermissionSelector from '@/components/permission-profile/PermissionSelector';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { usePermissionCatalog } from '@/lib/hooks/profile.hook';
import type {
  CreatePermissionProfilePayload,
  UpdatePermissionProfilePayload,
} from '@/lib/types/profile.type';

interface ProfileFormProps {
  mode: 'create' | 'edit';
  initialValues?: { name?: string; description?: string | null; permissions?: string[] };
  onSubmit: (payload: CreatePermissionProfilePayload | UpdatePermissionProfilePayload) => void;
  isPending?: boolean;
  errors?: Record<string, string>;
}

export default function ProfileForm({
  mode,
  initialValues,
  onSubmit,
  isPending = false,
  errors: serverErrors = {},
}: ProfileFormProps) {
  const { data: user } = useTenantMe();
  const catalogQuery = usePermissionCatalog();
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [permissions, setPermissions] = useState<string[]>(initialValues?.permissions ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const catalog = catalogQuery.data?.catalog ?? [];
  const grantableCatalog =
    user?.permissions.includes('*') === true
      ? catalog
      : catalog.filter((permission) => hasPermission(user, permission));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (permissions.length === 0) {
      nextErrors.permissions = 'Select at least one permission.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      permissions,
    });
  };

  const fieldError = (field: string) => errors[field] ?? serverErrors[field];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Profile details' : 'Edit profile'}</CardTitle>
        <CardDescription>
          Profiles are reusable permission sets assigned to tenant users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                aria-invalid={Boolean(fieldError('name'))}
                onChange={(event) => setName(event.target.value)}
              />
              {fieldError('name') ? (
                <p className="text-destructive text-xs">{fieldError('name')}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            {fieldError('permissions') ? (
              <p className="text-destructive text-xs">{fieldError('permissions')}</p>
            ) : null}
            {catalogQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading permissions…</p>
            ) : (
              <PermissionSelector
                catalog={grantableCatalog}
                selected={permissions}
                onChange={setPermissions}
              />
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? 'Saving…' : mode === 'create' ? 'Create profile' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
