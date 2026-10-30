import { ShieldX } from 'lucide-react';
import { Card } from '@shared/ui/card';

interface UnauthorizedProps {
  title?: string;
  message?: string;
}

export function Unauthorized({
  title = 'Access denied',
  message = 'You do not have permission to view this page.',
}: UnauthorizedProps) {
  return (
    <Card className="mt-3.5 flex min-h-96 w-full flex-col items-center justify-center rounded-2xl p-8 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="bg-muted rounded-full p-4">
          <ShieldX className="text-muted-foreground size-12" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
      </div>
    </Card>
  );
}
