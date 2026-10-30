import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@shared/lib/utils';

interface TableFooterProps {
  totalPages: number;
  pageParam?: string;
  from?: number | null;
  to?: number | null;
  total?: number | null;
  previousLabel?: string;
  nextLabel?: string;
}

function pageNumbers(current: number, total: number): (number | '...')[] {
  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  for (let page = Math.max(2, current - 1); page <= Math.min(total - 1, current + 1); page++) {
    pages.push(page);
  }

  if (current < total - 2) pages.push('...');
  if (total > 1) pages.push(total);

  return pages;
}

export default function TableFooter({
  totalPages,
  pageParam = 'page',
  from,
  to,
  total,
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
}: TableFooterProps) {
  const [searchParams] = useSearchParams();
  const current = Math.min(
    Math.max(Number(searchParams.get(pageParam) ?? 1), 1),
    Math.max(totalPages, 1),
  );
  const last = Math.max(totalPages, 1);

  const url = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set(pageParam, String(page));
    return `?${params.toString()}`;
  };

  const showCount = from != null && to != null && total != null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-3">
      <span className="text-muted-foreground text-xs">
        {showCount ? `Showing ${from}–${to} of ${total}` : ''}
      </span>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Link
          to={current <= 1 ? '#' : url(current - 1)}
          aria-disabled={current <= 1}
          aria-label={previousLabel}
          className={cn(
            'hover:bg-accent inline-flex size-8 items-center justify-center rounded-md',
            current <= 1 && 'pointer-events-none opacity-40',
          )}
        >
          <ChevronLeft className="size-4" />
        </Link>

        {pageNumbers(current, last).map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="text-muted-foreground px-1 text-xs">
              …
            </span>
          ) : (
            <Link
              key={page}
              to={url(page)}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-md text-xs',
                current === page
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground',
              )}
            >
              {page}
            </Link>
          ),
        )}

        <Link
          to={current >= last ? '#' : url(current + 1)}
          aria-disabled={current >= last}
          aria-label={nextLabel}
          className={cn(
            'hover:bg-accent inline-flex size-8 items-center justify-center rounded-md',
            current >= last && 'pointer-events-none opacity-40',
          )}
        >
          <ChevronRight className="size-4" />
        </Link>
      </nav>
    </div>
  );
}
