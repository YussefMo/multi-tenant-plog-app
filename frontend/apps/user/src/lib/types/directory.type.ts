export interface DirectoryTenant {
  id: number;
  name: string;
  category: string | null;
  published_posts_count: number;
}

export interface RecentPost {
  id: number;
  title: string;
  slug: string;
  published_at: string | null;
  author: { id: number; name: string } | null;
  tenant: { id: number; name: string } | null;
}

export interface ViewerOverview {
  counts: {
    tenants: number;
    published_posts: number;
  };
  categories: string[];
  recent_tenants: DirectoryTenant[];
  recent_posts: RecentPost[];
}

export interface TenantListParams {
  search?: string;
  category?: string;
  per_page?: number;
  page?: number;
}
