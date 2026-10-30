import { TableHead, TableHeader, TableRow } from '@shared/ui/table';
import { cn } from '@shared/lib/utils';

interface TableHeaderReProps {
  headers: string[];
  className?: string;
  lastColumnAlign?: 'start' | 'end';
}

export default function TableHeaderRe({
  headers,
  className,
  lastColumnAlign = 'start',
}: TableHeaderReProps) {
  return (
    <TableHeader className={cn('bg-muted/60', className)}>
      <TableRow className="hover:bg-transparent">
        {headers.map((header, index) => (
          <TableHead
            key={header}
            className={cn(
              'text-muted-foreground h-10 px-4 text-xs font-semibold',
              index === headers.length - 1 && lastColumnAlign === 'end' && 'text-end',
            )}
          >
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
