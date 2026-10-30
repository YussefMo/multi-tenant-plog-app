import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { titleCase } from '@/lib/format';
import type { PostStatus } from '@/lib/types/post.type';

export default function PostStatusBadge({ status }: { status: PostStatus }) {
  const variant =
    status === 'published' ? 'default' : status === 'archived' ? 'outline' : 'secondary';

  return <Badge variant={variant}>{titleCase(status)}</Badge>;
}
