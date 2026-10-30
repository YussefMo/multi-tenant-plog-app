import { Pencil, Rocket, Trash2, Undo2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DeleteAlert } from '@multi-tenant-plog/shared/components/app-parts';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import PostStatusBadge from '@/components/post/PostStatusBadge';
import { formatDateTime } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { useDeletePost, usePost, usePublishPost, useUnpublishPost } from '@/lib/hooks/post.hook';

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { data: user } = useTenantMe();
  const postQuery = usePost(postId);
  const publish = usePublishPost();
  const unpublish = useUnpublishPost();
  const remove = useDeletePost();

  if (postQuery.isLoading) {
    return <Spinner />;
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <ErrorPanel
        error={postQuery.error ?? new Error('Post not found.')}
        onRetry={() => void postQuery.refetch()}
      />
    );
  }

  const post = postQuery.data;
  const canEdit =
    hasPermission(user, 'posts.update.any') ||
    (hasPermission(user, 'posts.update.own') && post.author?.id === user?.id);
  const canDelete =
    hasPermission(user, 'posts.delete.any') ||
    (hasPermission(user, 'posts.delete.own') && post.author?.id === user?.id);
  const canPublish = hasPermission(user, 'posts.publish') && canEdit;

  const handlePublish = () => {
    publish.mutate(post.id, {
      onSuccess: () => notify.success('Post published.'),
      onError: (error) => notify.apiError(error, 'Unable to publish post.'),
    });
  };

  const handleUnpublish = () => {
    unpublish.mutate(post.id, {
      onSuccess: () => notify.success('Post unpublished.'),
      onError: (error) => notify.apiError(error, 'Unable to unpublish post.'),
    });
  };

  const handleDelete = () => {
    remove.mutate(post.id, {
      onSuccess: () => {
        notify.success('Post deleted.');
        navigate('/posts');
      },
      onError: (error) => notify.apiError(error, 'Unable to delete post.'),
    });
  };

  return (
    <div>
      <PageHeader
        title={post.title}
        description={`${post.status} · ${post.author?.name ?? 'Unknown author'}`}
        actions={
          <>
            {canEdit ? (
              <Button asChild variant="outline">
                <Link to={`/posts/${post.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
            ) : null}
            {canPublish ? (
              post.status === 'published' ? (
                <Button variant="outline" disabled={unpublish.isPending} onClick={handleUnpublish}>
                  <Undo2 className="size-4" />
                  Unpublish
                </Button>
              ) : (
                <Button disabled={publish.isPending} onClick={handlePublish}>
                  <Rocket className="size-4" />
                  Publish
                </Button>
              )
            ) : null}
            {canDelete ? (
              <DeleteAlert
                title={`Delete ${post.title}?`}
                description="The post is soft-deleted."
                isPending={remove.isPending}
                onConfirm={handleDelete}
                trigger={
                  <Button variant="destructive">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                }
              />
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Post body</CardTitle>
          <PostStatusBadge status={post.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap">{post.body}</p>
          <dl className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase">Slug</dt>
              <dd className="font-mono text-xs">{post.slug}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase">Published</dt>
              <dd>{formatDateTime(post.published_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase">Created</dt>
              <dd>{formatDateTime(post.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase">Updated</dt>
              <dd>{formatDateTime(post.updated_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
