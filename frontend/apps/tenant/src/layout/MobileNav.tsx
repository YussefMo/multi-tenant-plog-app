import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@multi-tenant-plog/shared/ui/sheet';
import ConsoleSidebar from '@/layout/ConsoleSidebar';

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Tenant console navigation</SheetTitle>
        </SheetHeader>
        <ConsoleSidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
