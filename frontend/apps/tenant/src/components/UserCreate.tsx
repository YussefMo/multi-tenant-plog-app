import { useState } from 'react';
import { ArrowRight, Copy, MailCheck } from 'lucide-react';
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
import PageHeader from '@/components/PageHeader';
import UserForm from '@/components/user/UserForm';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { useCreateUser } from '@/lib/hooks/user.hook';
import type { CreateUserPayload, UpdateUserPayload } from '@/lib/types/tenant.type';

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

export default function UserCreate() {
  const navigate = useNavigate();
  const { data: currentUser } = useTenantMe();
  const createUser = useCreateUser();
  const [result, setResult] = useState<Awaited<ReturnType<typeof createUser.mutateAsync>> | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (payload: CreateUserPayload | UpdateUserPayload) => {
    setErrors({});
    createUser.mutate(payload as CreateUserPayload, {
      onSuccess: (created) => {
        if (created.invitation) {
          setResult(created);
          notify.success('Invitation sent.');
        } else {
          notify.success('User created.');
          navigate(`/users/${created.data.id}`);
        }
      },
      onError: (error) => {
        setErrors(fieldErrors(error));
        notify.apiError(error, 'Unable to create user.');
      },
    });
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      notify.success('Invitation token copied.');
    } catch {
      notify.error('Unable to copy the token.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Invite user"
        description="Create a tenant admin or author and send an invitation."
      />

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailCheck className="size-5 text-emerald-500" />
              User created
            </CardTitle>
            <CardDescription>
              {result.data.name} was added as {result.data.role}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.invitation?.token ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Local invitation token</p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="bg-muted min-w-0 flex-1 overflow-x-auto rounded-md px-3 py-2 text-xs">
                    {result.invitation.token}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void copyToken(result.invitation?.token as string)}
                  >
                    <Copy className="size-4" />
                    Copy
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  This token is only returned in local and testing environments.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">The invitation email was sent.</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to={`/users/${result.data.id}`}>
                  Open user
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/users">Back to users</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <UserForm
          mode="create"
          currentUserId={currentUser?.id}
          onSubmit={submit}
          isPending={createUser.isPending}
          errors={errors}
        />
      )}
    </div>
  );
}
