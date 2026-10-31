import { Link } from 'react-router-dom';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Card, CardContent } from '@multi-tenant-plog/shared/ui/card';
import { formatDate } from '@/lib/format';
import type { Post } from '@/lib/types/post.type';

function excerpt(body: string): string {
  const text = body.replace(/\s+/g, ' ').trim();

  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

interface PostCardProps {
  post: Post;
  showTenant?: boolean;
}

export default function PostCard({ post, showTenant = false }: PostCardProps) {
  return (
    <Link to={`/posts/${post.id}`} className="group block h-full">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {showTenant && post.tenant ? (
              <Badge variant="secondary">{post.tenant.name}</Badge>
            ) : null}
            <span className="text-muted-foreground text-xs">{formatDate(post.published_at)}</span>
          </div>

          <p className="group-hover:text-primary text-lg font-semibold transition-colors">
            {post.title}
          </p>
          <p className="text-muted-foreground line-clamp-2 text-sm">{excerpt(post.body)}</p>

          {post.author ? (
            <p className="text-muted-foreground mt-auto pt-2 text-xs">By {post.author.name}</p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
