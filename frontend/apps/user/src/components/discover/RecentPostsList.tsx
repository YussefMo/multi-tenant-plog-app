import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/format';
import type { RecentPost } from '@/lib/types/directory.type';

export default function RecentPostsList({ posts }: { posts: RecentPost[] }) {
  return (
    <ul className="divide-y rounded-xl border">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            to={`/posts/${post.id}`}
            className="hover:bg-accent/50 flex items-center gap-4 px-4 py-3 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{post.title}</p>
              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {post.tenant?.name ?? 'Unknown tenant'}
                {post.author ? ` · ${post.author.name}` : ''}
                {post.published_at ? ` · ${formatDate(post.published_at)}` : ''}
              </p>
            </div>
            <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
