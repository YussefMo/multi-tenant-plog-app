import type { ReactNode } from 'react';
import { ServerCrash } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, StatePage } from '@multi-tenant-plog/shared/components/components-parts';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { useViewerMe } from '@/lib/hooks/auth.hook';

export default function RequireViewerAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, error, isError, isLoading } = useViewerMe();
  const isViewer = data?.role === 'user';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    const status = error instanceof ApiError ? error.status : 0;

    if (status === 401 || status === 403) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return (
      <StatePage
        icon={ServerCrash}
        tone="danger"
        title="Unable to reach the API"
        description={error instanceof Error ? error.message : 'The viewer API did not respond.'}
        actions={
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        }
      />
    );
  }

  if (!data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isViewer) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname, reason: 'tenant-session' }} />
    );
  }

  return <>{children}</>;
}
