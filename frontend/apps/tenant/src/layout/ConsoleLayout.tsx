import type { ReactNode } from 'react';
import ConsoleSidebar from '@/layout/ConsoleSidebar';
import ConsoleTopbar from '@/layout/ConsoleTopbar';
import SupportBanner from '@/layout/SupportBanner';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/20 min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="bg-background hidden border-r lg:flex lg:flex-col">
        <ConsoleSidebar />
      </aside>

      <div className="flex min-h-screen flex-col">
        <ConsoleTopbar />
        <SupportBanner />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
