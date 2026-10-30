import { Link } from 'react-router-dom';
import {
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatDate, titleCase } from '@/lib/format';
import type { Post } from '@/lib/types/post.type';

interface RecentPostsTableProps {
  posts: Post[];
  isLoading?: boolean;
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'published') return 'default';
  if (status === 'archived') return 'outline';

  return 'secondary';
}

export default function RecentPostsTable({ posts, isLoading = false }: RecentPostsTableProps) {
  return (
    <Table>
      <TableHeaderRe headers={['Post', 'Status', 'Author', 'Created']} />
      {isLoading ? (
        <TableBodySkeleton colNum={4} rowCount={5} />
      ) : posts.length === 0 ? (
        <TableBodyEmpty title="No posts yet" description="Create your first post to get started.">
          <Link className="text-primary text-sm underline" to="/posts/new">
            Create post
          </Link>
        </TableBodyEmpty>
      ) : (
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="px-4 py-3">
                <Link to={`/posts/${post.id}`} className="font-medium hover:underline">
                  {post.title}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant={statusVariant(post.status)}>{titleCase(post.status)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {post.author?.name ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDate(post.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
