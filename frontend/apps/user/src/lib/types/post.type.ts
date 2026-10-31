export type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
  id: number;
  tenant_id: number;
  title: string;
  slug: string;
  body: string;
  status: PostStatus;
  published_at: string | null;
  author: { id: number; name: string; role: string | null } | null;
  tenant: { id: number; name: string } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PostListParams {
  search?: string;
  per_page?: number;
  page?: number;
}
