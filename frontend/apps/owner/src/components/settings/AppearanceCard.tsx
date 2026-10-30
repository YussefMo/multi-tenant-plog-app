import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { env } from '@multi-tenant-plog/shared/lib/env';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@multi-tenant-plog/shared/ui/card';
import { ThemeToggle } from '@multi-tenant-plog/shared/ui/theme-toggle';
import { useOwnerLogout } from '@/lib/hooks/auth.hook';

export default function AppearanceCard() {
  const navigate = useNavigate();
  const logout = useOwnerLogout();

  const signOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        notify.success('Signed out.');
        navigate('/login', { replace: true });
      },
      onError: (error) => notify.apiError(error, 'Unable to sign out.'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance and app info</CardTitle>
        <CardDescription>Theme, API target, and session controls.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-muted-foreground text-xs">Switch between dark and light.</p>
          </div>
          <ThemeToggle />
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">App</dt>
            <dd className="font-medium">{env.appName}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">API</dt>
            <dd className="truncate font-mono text-xs">{env.apiUrl}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono text-xs">{env.apiVersion}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Realm</dt>
            <dd className="font-mono text-xs">owner_session</dd>
          </div>
        </dl>

        <Button variant="outline" disabled={logout.isPending} onClick={signOut}>
          <LogOut className="size-4" />
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      </CardContent>
    </Card>
  );
}
