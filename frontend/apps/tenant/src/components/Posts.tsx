import { Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card } from '@multi-tenant-plog/shared/ui/card';
import { TableFooter, TableTally } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import PostFilters from '@/components/post/PostFilters';
import PostTable from '@/components/post/PostTable';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { useDeletePost, usePosts, usePublishPost, useUnpublishPost } from '@/lib/hooks/post.hook';
import { useUsers } from '@/lib/hooks/user.hook';
import type { Post, PostListParams, PostStatus } from '@/lib/types/post.type';

export default function Posts() {
  const [searchParams] = useSearchParams();
  const { data: user } = useTenantMe();
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const status = searchParams.get('status') as PostStatus | null;
  const authorId = Number(searchParams.get('author_id') ?? 0);

  const params: PostListParams = {
    search: searchParams.get('search') ?? undefined,
    status: status ?? undefined,
    author_id: authorId > 0 ? authorId : undefined,
    page,
    per_page: 15,
  };

  const postsQuery = usePosts(params);
  const canViewUsers = hasPermission(user, 'users.view');
  const usersQuery = useUsers({ per_page: 100 }, { enabled: canViewUsers });
  const publish = usePublishPost();
  const unpublish = useUnpublishPost();
  const remove = useDeletePost();

  const authorOptions =
    usersQuery.data?.data.map((tenantUser) => ({
      value: String(tenantUser.id),
      label: tenantUser.name,
    })) ?? [];

  const handlePublish = (post: Post) => {
    publish.mutate(post.id, {
      onSuccess: () => notify.success('Post published.'),
      onError: (error) => notify.apiError(error, 'Unable to publish post.'),
    });
  };

  const handleUnpublish = (post: Post) => {
    unpublish.mutate(post.id, {
      onSuccess: () => notify.success('Post unpublished.'),
      onError: (error) => notify.apiError(error, 'Unable to unpublish post.'),
    });
  };

  const handleDelete = (post: Post) => {
    remove.mutate(post.id, {
      onSuccess: () => notify.success('Post deleted.'),
      onError: (error) => notify.apiError(error, 'Unable to delete post.'),
    });
  };

  const pendingPostId = publish.isPending
    ? publish.variables
    : unpublish.isPending
      ? unpublish.variables
      : remove.isPending
        ? remove.variables
        : null;

  const createAction = hasPermission(user, 'posts.create') ? (
    <Button asChild>
      <Link to="/posts/new">
        <Plus className="size-4" />
        Create post
      </Link>
    </Button>
  ) : undefined;

  const posts = postsQuery.data;

  return (
    <div>
      <PageHeader
        title="Posts"
        description="Write, publish, and manage tenant content."
        actions={createAction}
      />

      <Card className="overflow-hidden py-0">
        <div className="border-b p-4">
          <PostFilters authorOptions={authorOptions} showAuthor={canViewUsers} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <TableTally
            total={posts?.meta.total}
            currentPage={posts?.meta.current_page}
            lastPage={posts?.meta.last_page}
            entity="posts"
            actions={createAction}
          />
        </div>

        <div className="p-4">
          {postsQuery.isError ? (
            <ErrorPanel error={postsQuery.error} onRetry={() => void postsQuery.refetch()} />
          ) : (
            <PostTable
              posts={posts?.data ?? []}
              isLoading={postsQuery.isLoading}
              emptyAction={createAction}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onDelete={handleDelete}
              pendingPostId={
                typeof pendingPostId === 'number'
                  ? pendingPostId
                  : pendingPostId
                    ? Number(pendingPostId)
                    : null
              }
            />
          )}
        </div>

        {posts && posts.meta.last_page > 1 ? (
          <div className="border-t px-4">
            <TableFooter
              totalPages={posts.meta.last_page}
              from={posts.meta.from}
              to={posts.meta.to}
              total={posts.meta.total}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
