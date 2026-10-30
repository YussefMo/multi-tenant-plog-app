import { useNavigate } from 'react-router-dom';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import PageHeader from '@/components/PageHeader';
import PostForm from '@/components/post/PostForm';
import { useCreatePost } from '@/lib/hooks/post.hook';
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

export default function PostCreate() {
  const navigate = useNavigate();
  const createPost = useCreatePost();

  const submit = (payload: CreatePostPayload | UpdatePostPayload) => {
    createPost.mutate(payload as CreatePostPayload, {
      onSuccess: (post) => {
        notify.success('Post created.');
        navigate(`/posts/${post.id}`);
      },
      onError: (error) => notify.apiError(error, 'Unable to create post.'),
    });
  };

  return (
    <div>
      <PageHeader title="Create post" description="Start a new draft for this tenant." />
      <PostForm
        mode="create"
        onSubmit={submit}
        isPending={createPost.isPending}
        errors={fieldErrors(createPost.error)}
      />
    </div>
  );
}
