import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { useSearchParams } from '@/lib/router';
import { useAcceptInvitation } from '@/lib/hooks/auth.hook';

export default function AcceptInvitationForm() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const accept = useAcceptInvitation();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!token.trim()) {
      nextErrors.token = 'Invitation token is required.';
    }

    if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (password !== confirmation) {
      nextErrors.password_confirmation = 'Passwords do not match.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    accept.mutate(
      {
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: confirmation,
      },
      {
        onSuccess: () => {
          notify.success('Invitation accepted. You can sign in now.');
          navigate('/login', { replace: true });
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            setErrors(
              Object.fromEntries(
                Object.entries(error.errors).map(([field, messages]) => [
                  field,
                  messages[0] ?? 'Invalid value.',
                ]),
              ),
            );
          }

          notify.apiError(error, 'Unable to accept invitation.');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Accept invitation</CardTitle>
        <CardDescription>Set a password to activate your tenant account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email ? <p className="text-destructive text-xs">{errors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Invitation token</Label>
            <Input
              id="token"
              value={token}
              aria-invalid={Boolean(errors.token)}
              onChange={(event) => setToken(event.target.value)}
            />
            {errors.token ? <p className="text-destructive text-xs">{errors.token}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
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
              <Label htmlFor="password_confirmation">Confirm password</Label>
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

          <Button type="submit" className="w-full" disabled={accept.isPending}>
            <KeyRound className="size-4" />
            {accept.isPending ? 'Accepting…' : 'Accept invitation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
