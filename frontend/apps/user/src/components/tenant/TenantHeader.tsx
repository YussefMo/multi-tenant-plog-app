import { ArrowLeft, Building2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { formatNumber } from '@/lib/format';
import type { DirectoryTenant } from '@/lib/types/directory.type';

export default function TenantHeader({ tenant }: { tenant: DirectoryTenant }) {
  return (
    <div className="mb-6">
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to discover
      </Link>

      <div className="flex flex-wrap items-start gap-4">
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
          <Building2 className="size-7" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{tenant.name}</h2>
            {tenant.category ? <Badge variant="secondary">{tenant.category}</Badge> : null}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <FileText className="size-4" aria-hidden />
            {formatNumber(tenant.published_posts_count)} published{' '}
            {tenant.published_posts_count === 1 ? 'post' : 'posts'}
          </p>
        </div>
      </div>
    </div>
  );
}
