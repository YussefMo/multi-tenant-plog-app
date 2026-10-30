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
import { useOwnerMe, useUpdateOwnerProfile } from '@/lib/hooks/auth.hook';
import { formatDate } from '@/lib/format';

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

export default function OwnerProfileCard() {
  const { data: owner } = useOwnerMe();
  const updateProfile = useUpdateOwnerProfile();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (owner) {
      setName(owner.name);
      setEmail(owner.email);
    }
  }, [owner]);

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

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    updateProfile.mutate(
      { name: name.trim(), email: email.trim() },
      {
        onSuccess: () => notify.success('Profile updated.'),
        onError: (error) => {
          setErrors(fieldErrors(error));
          notify.apiError(error, 'Unable to update profile.');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          {owner ? `Owner since ${formatDate(owner.created_at)}` : 'Loading owner profile…'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="owner-name">Name</Label>
            <Input
              id="owner-name"
              value={name}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => setName(event.target.value)}
            />
            {errors.name ? <p className="text-destructive text-xs">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-email">Email</Label>
            <Input
              id="owner-email"
              type="email"
              value={email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email ? <p className="text-destructive text-xs">{errors.email}</p> : null}
          </div>

          <Button type="submit" disabled={updateProfile.isPending}>
            <Save className="size-4" />
            {updateProfile.isPending ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
