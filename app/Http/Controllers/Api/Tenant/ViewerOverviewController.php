<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\PostStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\User;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Viewer overview', description: 'Viewer discover metrics and recent content.')]
class ViewerOverviewController extends Controller
{
  #[Endpoint(title: 'Viewer overview', description: 'Return viewer counts, categories, recent tenants, and recent published posts.')]
  public function show(Request $request): JsonResponse
  {
    $user = $request->user();

    abort_unless($user instanceof User, 401);
    abort_unless($user->role === UserRole::User, 403);

    $publishedPosts = Post::query()
      ->withoutGlobalScope(TenantScope::class)
      ->where('status', PostStatus::Published->value)
      ->whereHas('tenant');

    $categories = Tenant::query()
      ->whereNotNull('category')
      ->where('category', '!=', '')
      ->distinct()
      ->orderBy('category')
      ->pluck('category')
      ->values();

    $recentTenants = Tenant::query()
      ->withCount([
        'posts as published_posts_count' => fn ($query) => $query
          ->withoutGlobalScope(TenantScope::class)
          ->where('status', PostStatus::Published->value),
      ])
      ->latest()
      ->limit(5)
      ->get();

    $recentPosts = Post::query()
      ->withoutGlobalScope(TenantScope::class)
      ->where('status', PostStatus::Published->value)
      ->whereHas('tenant')
      ->with(['author', 'tenant'])
      ->orderByDesc('published_at')
      ->limit(5)
      ->get();

    return response()->json([
      'data' => [
        'counts' => [
          'tenants' => Tenant::query()->count(),
          'published_posts' => $publishedPosts->count(),
        ],
        'categories' => $categories,
        'recent_tenants' => $recentTenants->map(fn (Tenant $tenant): array => [
          'id' => $tenant->id,
          'name' => $tenant->name,
          'category' => $tenant->category,
          'published_posts_count' => (int) $tenant->published_posts_count,
        ])->values(),
        'recent_posts' => $recentPosts->map(fn (Post $post): array => [
          'id' => $post->id,
          'title' => $post->title,
          'slug' => $post->slug,
          'published_at' => $post->published_at?->toIso8601String(),
          'author' => $post->author ? [
            'id' => $post->author->id,
            'name' => $post->author->name,
          ] : null,
          'tenant' => $post->tenant ? [
            'id' => $post->tenant->id,
            'name' => $post->tenant->name,
          ] : null,
        ])->values(),
      ],
    ]);
  }
}
