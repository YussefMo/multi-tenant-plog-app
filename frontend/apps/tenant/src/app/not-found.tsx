import { Link } from 'react-router-dom';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card, CardContent } from '@multi-tenant-plog/shared/ui/card';

export default function NotFound() {
  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="space-y-4 p-8">
          <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            404 · Tenant console
          </p>
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="text-muted-foreground text-sm">This tenant route does not exist.</p>
          <Button asChild>
            <Link to="/">Back to the console</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
