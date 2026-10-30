import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
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
import { useUpdateOwnerPassword } from '@/lib/hooks/auth.hook';

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

export default function OwnerPasswordCard() {
  const updatePassword = useUpdateOwnerPassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!currentPassword) {
      nextErrors.current_password = 'Current password is required.';
    }

    if (password.length < 8) {
      nextErrors.password = 'New password must be at least 8 characters.';
    }

    if (password !== confirmation) {
      nextErrors.password_confirmation = 'Passwords do not match.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    updatePassword.mutate(
      {
        current_password: currentPassword,
        password,
        password_confirmation: confirmation,
      },
      {
        onSuccess: () => {
          notify.success('Password updated.');
          setCurrentPassword('');
          setPassword('');
          setConfirmation('');
        },
        onError: (error) => {
          setErrors(fieldErrors(error));
          notify.apiError(error, 'Unable to update password.');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Changing your password keeps the current session active.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              aria-invalid={Boolean(errors.current_password)}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            {errors.current_password ? (
              <p className="text-destructive text-xs">{errors.current_password}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new_password">New password</Label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                value={password}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => setPassword(event.target.value)}
              />
              {errors.password ? (
                <p className="text-destructive text-xs">{errors.password}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm new password</Label>
              <Input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                aria-invalid={Boolean(errors.password_confirmation)}
                onChange={(event) => setConfirmation(event.target.value)}
              />
              {errors.password_confirmation ? (
                <p className="text-destructive text-xs">{errors.password_confirmation}</p>
              ) : null}
            </div>
          </div>

          <Button type="submit" disabled={updatePassword.isPending}>
            <KeyRound className="size-4" />
            {updatePassword.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
