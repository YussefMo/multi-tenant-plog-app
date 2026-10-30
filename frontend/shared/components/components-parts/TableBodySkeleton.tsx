import { Skeleton } from '@shared/ui/skeleton';
import { TableBody, TableCell, TableRow } from '@shared/ui/table';

interface TableBodySkeletonProps {
  colNum: number;
  rowCount?: number;
}

export default function TableBodySkeleton({ colNum, rowCount = 10 }: TableBodySkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: colNum }).map((_, colIndex) => (
            <TableCell key={colIndex} className="p-4">
              <Skeleton className="h-4 w-full min-w-12" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
