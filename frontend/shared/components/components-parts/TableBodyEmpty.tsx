import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { TableBody, TableCell, TableRow } from '@shared/ui/table';

interface TableBodyEmptyProps {
  children?: ReactNode;
  title?: string;
  description?: string;
}

export default function TableBodyEmpty({
  children,
  title = 'No results',
  description = 'There is nothing to show here yet.',
}: TableBodyEmptyProps) {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={100} className="border-0 px-0 py-16">
          <div className="mx-auto flex w-fit flex-col items-center p-5 text-center">
            <div className="bg-muted text-muted-foreground rounded-full p-4">
              <Inbox className="size-8" aria-hidden />
            </div>
            <p className="mt-4 font-semibold">{title}</p>
            <p className="text-muted-foreground text-sm">{description}</p>
            {children ? <div className="mt-6">{children}</div> : null}
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}
