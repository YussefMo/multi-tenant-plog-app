import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useViewerRegister } from '@/lib/hooks/auth.hook';

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmation: string;
}

function validate(values: RegisterValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (values.password !== values.confirmation) {
    errors.password_confirmation = 'Passwords do not match.';
  }

  return errors;
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const register = useViewerRegister();
  const [values, setValues] = useState<RegisterValues>({
    name: '',
    email: '',
    password: '',
    confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    register.mutate(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        password_confirmation: values.confirmation,
      },
      {
        onSuccess: () => {
          notify.success('Account created.');
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

          notify.apiError(error, 'Unable to create your account.');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Join to browse tenants and read published posts.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              value={values.name}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
            />
            {errors.name ? <p className="text-destructive text-xs">{errors.name}</p> : null}
          </div>

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
                autoComplete="new-password"
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

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              value={values.confirmation}
              aria-invalid={Boolean(errors.password_confirmation)}
              onChange={(event) =>
                setValues((current) => ({ ...current, confirmation: event.target.value }))
              }
            />
            {errors.password_confirmation ? (
              <p className="text-destructive text-xs">{errors.password_confirmation}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={register.isPending}>
            <UserPlus className="size-4" />
            {register.isPending ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
