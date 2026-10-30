import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import type { PaginatedResponse } from '@/lib/types/api.type';
import type {
  CreatePostPayload,
  Post,
  PostListParams,
  UpdatePostPayload,
} from '@/lib/types/post.type';

export async function listPosts(params: PostListParams = {}): Promise<PaginatedResponse<Post>> {
  const { data } = await tenantApi.get<PaginatedResponse<Post>>('/posts', { params });

  return data;
}

export async function getPost(postId: number | string): Promise<Post> {
  const { data } = await tenantApi.get<{ data: Post }>(`/posts/${postId}`);

  return data.data;
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const { data } = await tenantApi.post<{ data: Post }>('/posts', payload);

  return data.data;
}

export async function updatePost(
  postId: number | string,
  payload: UpdatePostPayload,
): Promise<Post> {
  const { data } = await tenantApi.patch<{ data: Post }>(`/posts/${postId}`, payload);

  return data.data;
}

export async function deletePost(postId: number | string): Promise<void> {
  await tenantApi.delete(`/posts/${postId}`);
}

export async function publishPost(postId: number | string): Promise<Post> {
  const { data } = await tenantApi.post<{ data: Post }>(`/posts/${postId}/publish`);

  return data.data;
}

export async function unpublishPost(postId: number | string): Promise<Post> {
  const { data } = await tenantApi.post<{ data: Post }>(`/posts/${postId}/unpublish`);

  return data.data;
}
