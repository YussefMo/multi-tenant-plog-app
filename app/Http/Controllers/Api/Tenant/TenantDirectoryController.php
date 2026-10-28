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
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TenantDirectoryController extends Controller
{
  public function index(Request $request): AnonymousResourceCollection
  {
    $this->ensureViewer($request);

    $tenants = Tenant::query()
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
      ->paginate(15);

    return TenantDirectoryResource::collection($tenants);
  }

  public function posts(Request $request, Tenant $tenant): AnonymousResourceCollection
  {
    $this->ensureViewer($request);

    $posts = Post::query()
      ->withoutGlobalScope(TenantScope::class)
      ->where('tenant_id', $tenant->id)
      ->where('status', PostStatus::Published->value)
      ->with('author')
      ->orderByDesc('published_at')
      ->paginate(15);

    return PostResource::collection($posts);
  }

  private function ensureViewer(Request $request): void
  {
    $user = $request->user();

    abort_unless($user instanceof User, 401);
    abort_unless($user->role === UserRole::User, 403);
  }
}
