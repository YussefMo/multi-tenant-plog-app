import { useQuery } from '@tanstack/react-query';
import { getPublishedPost, listPublishedPosts } from '@/lib/action/post.action';
import { viewerKeys } from '@/lib/query-keys';
import type { PostListParams } from '@/lib/types/post.type';

export function usePosts(params: PostListParams = {}) {
  return useQuery({
    queryKey: viewerKeys.posts(params),
    queryFn: () => listPublishedPosts(params),
    staleTime: 0,
    gcTime: 0,
  });
}

export function usePost(postId: number | string | undefined) {
  return useQuery({
    queryKey: viewerKeys.post(postId ?? ''),
    queryFn: () => getPublishedPost(postId as number | string),
    enabled: Boolean(postId),
    staleTime: 0,
    gcTime: 0,
  });
}
