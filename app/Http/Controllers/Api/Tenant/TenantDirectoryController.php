<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\PostStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Http\Resources\TenantDirectoryResource;
use App\Models\Post;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\User;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Viewer directory', description: 'Viewer tenant directory, profile, and published posts.')]
class TenantDirectoryController extends Controller
{
  #[Endpoint(title: 'List directory tenants', description: 'List active tenants with search, category, and pagination.')]
  public function index(Request $request): AnonymousResourceCollection
  {
    $this->ensureViewer($request);

    $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
    $search = trim((string) $request->query('search', ''));

    $tenants = Tenant::query()
      ->when($search !== '', function ($query) use ($search): void {
        $query->where(function ($query) use ($search): void {
          $query->where('name', 'like', "%{$search}%")
            ->orWhere('category', 'like', "%{$search}%");
        });
      })
      ->when(
        $request->filled('name'),
        fn ($query) => $query->where('name', 'like', '%'.$request->string('name')->toString().'%'),
      )
      ->when(
        $request->filled('category'),
        fn ($query) => $query->where('category', $request->string('category')->toString()),
      )
      ->withCount([
        'posts as published_posts_count' => fn ($query) => $query
          ->withoutGlobalScope(TenantScope::class)
          ->where('status', PostStatus::Published->value),
      ])
      ->orderBy('name')
      ->paginate($perPage)
      ->withQueryString();

    return TenantDirectoryResource::collection($tenants);
  }

  #[Endpoint(title: 'Show directory tenant', description: 'Return one active tenant with its published post count.')]
  public function show(Request $request, Tenant $tenant): TenantDirectoryResource
  {
    $this->ensureViewer($request);

    $tenant->loadCount([
      'posts as published_posts_count' => fn ($query) => $query
        ->withoutGlobalScope(TenantScope::class)
        ->where('status', PostStatus::Published->value),
    ]);

    return new TenantDirectoryResource($tenant);
  }

  #[Endpoint(title: 'List tenant published posts', description: 'List published posts for one active tenant with search and pagination.')]
  public function posts(Request $request, Tenant $tenant): AnonymousResourceCollection
  {
    $this->ensureViewer($request);

    $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
    $search = trim((string) $request->query('search', ''));

    $posts = Post::query()
      ->withoutGlobalScope(TenantScope::class)
      ->where('tenant_id', $tenant->id)
      ->where('status', PostStatus::Published->value)
      ->with(['author', 'tenant'])
      ->when($search !== '', function ($query) use ($search): void {
        $query->where(function ($query) use ($search): void {
          $query->where('title', 'like', "%{$search}%")
            ->orWhere('slug', 'like', "%{$search}%");
        });
      })
      ->orderByDesc('published_at')
      ->paginate($perPage)
      ->withQueryString();

    return PostResource::collection($posts);
  }

  private function ensureViewer(Request $request): void
  {
    $user = $request->user();

    abort_unless($user instanceof User, 401);
    abort_unless($user->role === UserRole::User, 403);
  }
}
