import { AlertTriangle } from 'lucide-react';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card } from '@multi-tenant-plog/shared/ui/card';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';

interface ErrorPanelProps {
  error: unknown;
  onRetry?: () => void;
}

export default function ErrorPanel({ error, onRetry }: ErrorPanelProps) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Something went wrong.';

  return (
    <Card className="items-center gap-3 p-8 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <div>
        <p className="font-semibold">Unable to load this data</p>
        <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}
