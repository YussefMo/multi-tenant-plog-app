import type { ReactNode } from 'react';
import ViewerTopbar from '@/layout/ViewerTopbar';

export default function ViewerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/20 flex min-h-screen flex-col">
      <ViewerTopbar />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
