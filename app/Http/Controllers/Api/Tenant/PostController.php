<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\PostStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StorePostRequest;
use App\Http\Requests\Tenant\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
  public function index(Request $request): AnonymousResourceCollection
  {
    $user = $request->user();
    abort_unless($user instanceof User, 401);

    $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
    $search = trim((string) $request->query('search', ''));

    $posts = Post::query()
      ->visibleTo($user)
      ->whereHas('tenant')
      ->with(['author', 'tenant'])
      ->when($search !== '', function ($query) use ($search): void {
        $query->where(function ($query) use ($search): void {
          $query->where('title', 'like', "%{$search}%")
            ->orWhere('slug', 'like', "%{$search}%");
        });
      })
      ->when(
        $request->filled('status'),
        fn ($query) => $query->where('status', $request->string('status')->toString()),
      )
      ->when(
        $request->filled('author_id'),
        fn ($query) => $query->where('user_id', $request->integer('author_id')),
      )
      ->when(
        $user->role === UserRole::User,
        fn ($query) => $query->orderByDesc('published_at'),
        fn ($query) => $query->latest(),
      )
      ->paginate($perPage)
      ->withQueryString();

    return PostResource::collection($posts);
  }

  public function store(StorePostRequest $request): JsonResponse
  {
    $user = $request->user();
    abort_unless($user instanceof User, 401);

    $post = new Post($request->validated());
    $post->tenant_id = $user->tenant_id;
    $post->user_id = $user->id;
    $post->status = PostStatus::Draft;
    $post->save();

    return (new PostResource($post->load(['author', 'tenant'])))->response()->setStatusCode(201);
  }

  public function show(Post $post): PostResource
  {
    abort_if($post->tenant === null, 404);
    Gate::authorize('view', $post);

    return new PostResource($post->load(['author', 'tenant']));
  }

  public function update(UpdatePostRequest $request, Post $post): PostResource
  {
    Gate::authorize('update', $post);
    $post->update($request->validated());

    return new PostResource($post->load(['author', 'tenant']));
  }

  public function destroy(Post $post): Response
  {
    Gate::authorize('delete', $post);
    $post->delete();

    return response()->noContent();
  }

  public function publish(Post $post): PostResource
  {
    Gate::authorize('publish', $post);

    $post->update([
      'status' => PostStatus::Published,
      'published_at' => $post->published_at ?? now(),
    ]);

    return new PostResource($post->load(['author', 'tenant']));
  }

  public function unpublish(Post $post): PostResource
  {
    Gate::authorize('publish', $post);

    $post->update([
      'status' => PostStatus::Draft,
      'published_at' => null,
    ]);

    return new PostResource($post->load(['author', 'tenant']));
  }
}
