import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@shared/ui/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/30 relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute end-4 top-4">
        <ThemeToggle compact />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <span>Owner Console</span>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">Multi Tenant Plog</p>
        </div>

        {children}
      </div>
    </div>
  );
}
