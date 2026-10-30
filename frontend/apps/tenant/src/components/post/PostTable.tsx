import type { ReactNode } from 'react';
import { Eye, Pencil, Rocket, Trash2, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeleteAlert } from '@multi-tenant-plog/shared/components/app-parts';
import {
  PillButton,
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatDate } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import type { Post } from '@/lib/types/post.type';
import PostStatusBadge from '@/components/post/PostStatusBadge';

interface PostTableProps {
  posts: Post[];
  isLoading?: boolean;
  emptyAction?: ReactNode;
  onPublish?: (post: Post) => void;
  onUnpublish?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  pendingPostId?: number | null;
}

export default function PostTable({
  posts,
  isLoading = false,
  emptyAction,
  onPublish,
  onUnpublish,
  onDelete,
  pendingPostId = null,
}: PostTableProps) {
  const navigate = useNavigate();
  const { data: user } = useTenantMe();

  const canEdit = (post: Post) =>
    hasPermission(user, 'posts.update.any') ||
    (hasPermission(user, 'posts.update.own') && post.author?.id === user?.id);

  const canDelete = (post: Post) =>
    hasPermission(user, 'posts.delete.any') ||
    (hasPermission(user, 'posts.delete.own') && post.author?.id === user?.id);

  const canPublish = (post: Post) => hasPermission(user, 'posts.publish') && canEdit(post);

  return (
    <Table>
      <TableHeaderRe
        headers={['Post', 'Status', 'Author', 'Published', 'Created', 'Actions']}
        lastColumnAlign="end"
      />
      {isLoading ? (
        <TableBodySkeleton colNum={6} rowCount={8} />
      ) : posts.length === 0 ? (
        <TableBodyEmpty title="No posts found" description="Create a post or adjust the filters.">
          {emptyAction}
        </TableBodyEmpty>
      ) : (
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="px-4 py-3">
                <div className="font-medium">{post.title}</div>
                <div className="text-muted-foreground text-xs">{post.slug}</div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <PostStatusBadge status={post.status} />
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {post.author?.name ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDate(post.published_at)}
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDate(post.created_at)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <PillButton
                    label="View post"
                    icon={Eye}
                    onClick={() => navigate(`/posts/${post.id}`)}
                  />
                  {canEdit(post) ? (
                    <PillButton
                      label="Edit post"
                      icon={Pencil}
                      onClick={() => navigate(`/posts/${post.id}/edit`)}
                    />
                  ) : null}
                  {canPublish(post) ? (
                    post.status === 'published' ? (
                      <PillButton
                        label="Unpublish post"
                        icon={Undo2}
                        disabled={pendingPostId === post.id}
                        onClick={() => onUnpublish?.(post)}
                      />
                    ) : (
                      <PillButton
                        label="Publish post"
                        icon={Rocket}
                        disabled={pendingPostId === post.id}
                        onClick={() => onPublish?.(post)}
                      />
                    )
                  ) : null}
                  {canDelete(post) ? (
                    <DeleteAlert
                      title={`Delete ${post.title}?`}
                      description="The post is soft-deleted and removed from the list."
                      isPending={pendingPostId === post.id}
                      onConfirm={() => onDelete?.(post)}
                      trigger={<PillButton label="Delete post" icon={Trash2} />}
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
