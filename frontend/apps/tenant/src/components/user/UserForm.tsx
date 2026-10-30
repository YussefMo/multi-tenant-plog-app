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
import { Checkbox } from '@multi-tenant-plog/shared/ui/checkbox';
import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Label } from '@multi-tenant-plog/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@multi-tenant-plog/shared/ui/select';
import PermissionSelector from '@/components/permission-profile/PermissionSelector';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { usePermissionCatalog, useProfiles } from '@/lib/hooks/profile.hook';
import type { CreateUserPayload, UpdateUserPayload } from '@/lib/types/tenant.type';

interface UserFormProps {
  mode: 'create' | 'edit';
  initialValues?: {
    name?: string;
    email?: string;
    role?: 'admin' | 'author';
    permission_profile_id?: number | null;
    extra_permissions?: string[];
    is_tenant_owner?: boolean;
  };
  currentUserId?: number;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => void;
  isPending?: boolean;
  errors?: Record<string, string>;
}

export default function UserForm({
  mode,
  initialValues,
  currentUserId,
  onSubmit,
  isPending = false,
  errors: serverErrors = {},
}: UserFormProps) {
  const { data: user } = useTenantMe();
  const canLoadProfiles = hasPermission(user, 'profiles.view');
  const catalogQuery = usePermissionCatalog({
    enabled: canLoadProfiles || hasPermission(user, 'users.view'),
  });
  const profilesQuery = useProfiles({ per_page: 100 }, { enabled: canLoadProfiles });
  const [name, setName] = useState(initialValues?.name ?? '');
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [role, setRole] = useState<'admin' | 'author'>(initialValues?.role ?? 'author');
  const [invite, setInvite] = useState(mode === 'create');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [profileId, setProfileId] = useState(
    initialValues?.permission_profile_id ? String(initialValues.permission_profile_id) : 'none',
  );
  const [extraPermissions, setExtraPermissions] = useState<string[]>(
    initialValues?.extra_permissions ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const catalog = catalogQuery.data?.catalog ?? [];
  const grantableCatalog =
    user?.permissions.includes('*') === true
      ? catalog
      : catalog.filter((permission) => hasPermission(user, permission));

  const profileOptions = profilesQuery.data?.data ?? [];
  const isSelf =
    mode === 'edit' && currentUserId !== undefined && initialValues?.email === user?.email;
  const isTenantOwner = mode === 'edit' && initialValues?.is_tenant_owner === true;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (mode === 'create' && !invite) {
      if (password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters.';
      }

      if (password !== confirmation) {
        nextErrors.password_confirmation = 'Passwords do not match.';
      }
    }

    if (mode === 'edit' && password !== '') {
      if (password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters.';
      }

      if (password !== confirmation) {
        nextErrors.password_confirmation = 'Passwords do not match.';
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const profileValue = profileId === 'none' ? null : Number(profileId);

    if (mode === 'create') {
      onSubmit({
        name: name.trim(),
        email: email.trim(),
        role,
        invite,
        ...(invite
          ? {}
          : {
              password,
              password_confirmation: confirmation,
            }),
        permission_profile_id: profileValue,
        extra_permissions: extraPermissions,
      });

      return;
    }

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      role,
      permission_profile_id: profileValue,
      extra_permissions: extraPermissions,
      ...(password !== ''
        ? {
            password,
            password_confirmation: confirmation,
          }
        : {}),
    });
  };

  const fieldError = (field: string) => errors[field] ?? serverErrors[field];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'User details' : 'Edit user'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Invite an admin or author to this tenant.'
            : 'Update role, profile, permissions, or password.'}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                aria-invalid={Boolean(fieldError('email'))}
                onChange={(event) => setEmail(event.target.value)}
              />
              {fieldError('email') ? (
                <p className="text-destructive text-xs">{fieldError('email')}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as 'admin' | 'author')}
                disabled={isSelf || isTenantOwner}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {isTenantOwner
                  ? 'The tenant owner role is locked.'
                  : 'Normal users use the separate user client.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Permission profile</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="No profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No profile</SelectItem>
                  {profileOptions.map((profile) => (
                    <SelectItem key={profile.id} value={String(profile.id)}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === 'create' ? (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="invite"
                  checked={invite}
                  onCheckedChange={(checked) => setInvite(checked === true)}
                />
                <div>
                  <Label htmlFor="invite" className="font-normal">
                    Invite user
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Send an invitation email instead of setting a password now.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    disabled={invite}
                    aria-invalid={Boolean(fieldError('password'))}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  {fieldError('password') ? (
                    <p className="text-destructive text-xs">{fieldError('password')}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">Confirm password</Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    disabled={invite}
                    aria-invalid={Boolean(fieldError('password_confirmation'))}
                    onChange={(event) => setConfirmation(event.target.value)}
                  />
                  {fieldError('password_confirmation') ? (
                    <p className="text-destructive text-xs">
                      {fieldError('password_confirmation')}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">New password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  aria-invalid={Boolean(fieldError('password'))}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {fieldError('password') ? (
                  <p className="text-destructive text-xs">{fieldError('password')}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm new password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  aria-invalid={Boolean(fieldError('password_confirmation'))}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
                {fieldError('password_confirmation') ? (
                  <p className="text-destructive text-xs">{fieldError('password_confirmation')}</p>
                ) : null}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Extra permissions</Label>
            {catalogQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading permissions…</p>
            ) : (
              <PermissionSelector
                catalog={grantableCatalog}
                selected={extraPermissions}
                onChange={setExtraPermissions}
              />
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
