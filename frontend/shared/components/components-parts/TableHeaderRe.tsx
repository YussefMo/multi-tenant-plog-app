import { TableHead, TableHeader, TableRow } from '@shared/ui/table';
import { cn } from '@shared/lib/utils';

interface TableHeaderReProps {
  headers: string[];
  className?: string;
}

export default function TableHeaderRe({ headers, className }: TableHeaderReProps) {
  return (
    <TableHeader className={cn('bg-muted/60', className)}>
      <TableRow className="hover:bg-transparent">
        {headers.map((header, index) => (
          <TableHead
            key={header}
            className={cn(
              'text-muted-foreground h-10 px-4 text-xs font-semibold',
              index === headers.length - 1 && 'text-end',
              index !== 0 && index !== headers.length - 1 && 'text-center',
            )}
          >
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
