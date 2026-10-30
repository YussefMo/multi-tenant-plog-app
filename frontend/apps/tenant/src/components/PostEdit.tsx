import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import PostForm from '@/components/post/PostForm';
import { usePost, useUpdatePost } from '@/lib/hooks/post.hook';
import type { CreatePostPayload, UpdatePostPayload } from '@/lib/types/post.type';

function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.errors).map(([field, messages]) => [
      field,
      messages[0] ?? 'Invalid value.',
    ]),
  );
}

export default function PostEdit() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const postQuery = usePost(postId);
  const updatePost = useUpdatePost(postId ?? '');

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

  const submit = (payload: CreatePostPayload | UpdatePostPayload) => {
    updatePost.mutate(payload as UpdatePostPayload, {
      onSuccess: () => {
        notify.success('Post updated.');
        navigate(`/posts/${postQuery.data.id}`);
      },
      onError: (error) => notify.apiError(error, 'Unable to update post.'),
    });
  };

  return (
    <div>
      <PageHeader title="Edit post" description={postQuery.data.title} />
      <PostForm
        mode="edit"
        initialValues={{ title: postQuery.data.title, body: postQuery.data.body }}
        onSubmit={submit}
        isPending={updatePost.isPending}
        errors={fieldErrors(updatePost.error)}
      />
    </div>
  );
}
