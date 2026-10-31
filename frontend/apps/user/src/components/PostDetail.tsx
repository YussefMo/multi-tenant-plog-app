import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import { useParams } from '@multi-tenant-plog/shared/lib/router';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Card, CardContent } from '@multi-tenant-plog/shared/ui/card';
import ErrorPanel from '@/components/ErrorPanel';
import { formatDateTime } from '@/lib/format';
import { usePost } from '@/lib/hooks/post.hook';

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const post = usePost(postId);

  if (post.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (post.isError || !post.data) {
    return <ErrorPanel error={post.error} onRetry={() => void post.refetch()} />;
  }

  const data = post.data;

  return (
    <article>
      <Link
        to="/posts"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to latest posts
      </Link>

      <Card>
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {data.tenant ? (
              <Link to={`/tenants/${data.tenant.id}`}>
                <Badge variant="secondary">{data.tenant.name}</Badge>
              </Link>
            ) : null}
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDateTime(data.published_at)}
            </span>
            {data.author ? (
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                <UserRound className="size-3.5" aria-hidden />
                {data.author.name}
              </span>
            ) : null}
          </div>

          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{data.title}</h2>

          <div className="text-sm leading-relaxed whitespace-pre-wrap">{data.body}</div>
        </CardContent>
      </Card>
    </article>
  );
}
