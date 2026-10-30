import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
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
import { Checkbox } from '@multi-tenant-plog/shared/ui/checkbox';
import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Label } from '@multi-tenant-plog/shared/ui/label';
import { useOwnerLogin } from '@/lib/hooks/auth.hook';

interface LoginValues {
  email: string;
  password: string;
  remember: boolean;
}

function validate(values: LoginValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

export default function LoginForm() {
  const navigate = useNavigate();
  const login = useOwnerLogin();
  const [values, setValues] = useState<LoginValues>({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    login.mutate(values, {
      onSuccess: () => {
        notify.success('Welcome back.');
        navigate('/', { replace: true });
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

        notify.apiError(error, 'Unable to sign in.');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Use your owner account to manage tenants, plans, and billing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) =>
                setValues((current) => ({ ...current, email: event.target.value }))
              }
            />
            {errors.email ? <p className="text-destructive text-xs">{errors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={values.password}
                aria-invalid={Boolean(errors.password)}
                className="pe-10"
                onChange={(event) =>
                  setValues((current) => ({ ...current, password: event.target.value }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute end-1 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            {errors.password ? <p className="text-destructive text-xs">{errors.password}</p> : null}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={values.remember}
              onCheckedChange={(checked) =>
                setValues((current) => ({ ...current, remember: checked === true }))
              }
            />
            <Label htmlFor="remember" className="text-sm font-normal">
              Remember me
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={login.isPending}>
            <LogIn className="size-4" />
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
