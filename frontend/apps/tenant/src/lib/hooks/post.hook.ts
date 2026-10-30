import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  publishPost,
  unpublishPost,
  updatePost,
} from '@/lib/action/post.action';
import { tenantKeys } from '@/lib/query-keys';
import type { CreatePostPayload, PostListParams, UpdatePostPayload } from '@/lib/types/post.type';

const postsRoot = ['tenant', 'posts'] as const;

function useInvalidatePosts() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: postsRoot });
    void queryClient.invalidateQueries({ queryKey: tenantKeys.overview });
  };
}

export function usePosts(params: PostListParams = {}) {
  return useQuery({
    queryKey: tenantKeys.posts(params),
    queryFn: () => listPosts(params),
    staleTime: 0,
    gcTime: 0,
  });
}

export function usePost(postId: number | string | undefined) {
  return useQuery({
    queryKey: tenantKeys.post(postId ?? ''),
    queryFn: () => getPost(postId as number | string),
    enabled: Boolean(postId),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreatePost() {
  const invalidate = useInvalidatePosts();

  return useMutation({
    mutationFn: (payload: CreatePostPayload) => createPost(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePost(postId: number | string) {
  const invalidate = useInvalidatePosts();

  return useMutation({
    mutationFn: (payload: UpdatePostPayload) => updatePost(postId, payload),
    onSuccess: invalidate,
  });
}

export function useDeletePost() {
  const invalidate = useInvalidatePosts();

  return useMutation({
    mutationFn: (postId: number | string) => deletePost(postId),
    onSuccess: invalidate,
  });
}

export function usePublishPost() {
  const invalidate = useInvalidatePosts();

  return useMutation({
    mutationFn: (postId: number | string) => publishPost(postId),
    onSuccess: invalidate,
  });
}

export function useUnpublishPost() {
  const invalidate = useInvalidatePosts();

  return useMutation({
    mutationFn: (postId: number | string) => unpublishPost(postId),
    onSuccess: invalidate,
  });
}
