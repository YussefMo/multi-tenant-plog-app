import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner, StatePage } from '@multi-tenant-plog/shared/components/components-parts';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { useSearchParams } from '@/lib/router';
import { useSupportLogin } from '@/lib/hooks/auth.hook';

export default function SupportAccept() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const ticket = searchParams.get('ticket') ?? '';
  const supportLogin = useSupportLogin();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    if (!ticket) {
      return;
    }

    supportLogin.mutate(ticket, {
      onSuccess: () => navigate('/', { replace: true }),
    });
  }, [navigate, supportLogin, ticket]);

  if (!ticket) {
    return (
      <StatePage
        icon={AlertTriangle}
        tone="danger"
        title="Support ticket missing"
        description="This support link is incomplete or expired."
        actions={
          <Button asChild variant="outline">
            <Link to="/login">Go to sign in</Link>
          </Button>
        }
      />
    );
  }

  if (supportLogin.isError) {
    return (
      <StatePage
        icon={AlertTriangle}
        tone="danger"
        title="Support access failed"
        description={
          supportLogin.error instanceof Error
            ? supportLogin.error.message
            : 'The support ticket is invalid or expired.'
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/login">Go to sign in</Link>
          </Button>
        }
      />
    );
  }

  return <Spinner className="min-h-screen" />;
}
