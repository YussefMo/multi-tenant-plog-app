import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import type { PaginatedResponse } from '@/lib/types/api.type';
import type { Post, PostListParams } from '@/lib/types/post.type';

export async function listPublishedPosts(
  params: PostListParams = {},
): Promise<PaginatedResponse<Post>> {
  const { data } = await tenantApi.get<PaginatedResponse<Post>>('/posts', { params });

  return data;
}

export async function getPublishedPost(postId: number | string): Promise<Post> {
  const { data } = await tenantApi.get<{ data: Post }>(`/posts/${postId}`);

  return data.data;
}
