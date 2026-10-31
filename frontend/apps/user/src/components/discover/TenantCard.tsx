import { Building2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Card, CardContent } from '@multi-tenant-plog/shared/ui/card';
import { formatNumber } from '@/lib/format';
import type { DirectoryTenant } from '@/lib/types/directory.type';

export default function TenantCard({ tenant }: { tenant: DirectoryTenant }) {
  return (
    <Link to={`/tenants/${tenant.id}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Building2 className="size-5" aria-hidden />
            </div>
            {tenant.category ? <Badge variant="secondary">{tenant.category}</Badge> : null}
          </div>

          <div>
            <p className="group-hover:text-primary font-semibold transition-colors">
              {tenant.name}
            </p>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <FileText className="size-3.5" aria-hidden />
              {formatNumber(tenant.published_posts_count)} published{' '}
              {tenant.published_posts_count === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
