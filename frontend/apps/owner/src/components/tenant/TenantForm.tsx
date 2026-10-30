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
import type { CreateTenantPayload, UpdateTenantPayload } from '@/lib/types/tenant.type';

interface TenantFormValues {
  name: string;
  category: string;
  admin_name: string;
  admin_email: string;
}

interface TenantFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<TenantFormValues>;
  onSubmit: (payload: CreateTenantPayload | UpdateTenantPayload) => void;
  isPending?: boolean;
  errors?: Record<string, string>;
}

function validate(values: TenantFormValues, mode: 'create' | 'edit'): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = 'Tenant name is required.';
  }

  if (mode === 'create') {
    if (!values.admin_name.trim()) {
      errors.admin_name = 'Admin name is required.';
    }

    if (!values.admin_email.trim()) {
      errors.admin_email = 'Admin email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.admin_email)) {
      errors.admin_email = 'Enter a valid email address.';
    }
  }

  return errors;
}

export default function TenantForm({
  mode,
  initialValues,
  onSubmit,
  isPending = false,
  errors: serverErrors = {},
}: TenantFormProps) {
  const [values, setValues] = useState<TenantFormValues>({
    name: initialValues?.name ?? '',
    category: initialValues?.category ?? '',
    admin_name: initialValues?.admin_name ?? '',
    admin_email: initialValues?.admin_email ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: keyof TenantFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values, mode);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (mode === 'create') {
      onSubmit({
        name: values.name.trim(),
        category: values.category.trim() || null,
        admin_name: values.admin_name.trim(),
        admin_email: values.admin_email.trim(),
      });
    } else {
      onSubmit({
        name: values.name.trim(),
        category: values.category.trim() || null,
      });
    }
  };

  const fieldError = (field: keyof TenantFormValues) => errors[field] ?? serverErrors[field];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Tenant details' : 'Edit tenant'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Provision a tenant and invite its first admin.'
            : 'Update the tenant name or category.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Tenant name</Label>
              <Input
                id="name"
                value={values.name}
                aria-invalid={Boolean(fieldError('name'))}
                onChange={(event) => update('name', event.target.value)}
              />
              {fieldError('name') ? (
                <p className="text-destructive text-xs">{fieldError('name')}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={values.category}
                onChange={(event) => update('category', event.target.value)}
              />
              {fieldError('category') ? (
                <p className="text-destructive text-xs">{fieldError('category')}</p>
              ) : null}
            </div>
          </div>

          {mode === 'create' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin_name">Admin name</Label>
                <Input
                  id="admin_name"
                  value={values.admin_name}
                  aria-invalid={Boolean(fieldError('admin_name'))}
                  onChange={(event) => update('admin_name', event.target.value)}
                />
                {fieldError('admin_name') ? (
                  <p className="text-destructive text-xs">{fieldError('admin_name')}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin email</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={values.admin_email}
                  aria-invalid={Boolean(fieldError('admin_email'))}
                  onChange={(event) => update('admin_email', event.target.value)}
                />
                {fieldError('admin_email') ? (
                  <p className="text-destructive text-xs">{fieldError('admin_email')}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? 'Saving…' : mode === 'create' ? 'Create tenant' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
