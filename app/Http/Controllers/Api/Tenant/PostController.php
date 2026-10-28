<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\PostStatus;
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

    $posts = Post::query()
      ->visibleTo($user)
      ->with('author')
      ->latest()
      ->paginate(15);

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

    return (new PostResource($post->load('author')))->response()->setStatusCode(201);
  }

  public function show(Post $post): PostResource
  {
    Gate::authorize('view', $post);

    return new PostResource($post->load('author'));
  }

  public function update(UpdatePostRequest $request, Post $post): PostResource
  {
    Gate::authorize('update', $post);
    $post->update($request->validated());

    return new PostResource($post->load('author'));
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

    return new PostResource($post->load('author'));
  }

  public function unpublish(Post $post): PostResource
  {
    Gate::authorize('publish', $post);

    $post->update([
      'status' => PostStatus::Draft,
      'published_at' => null,
    ]);

    return new PostResource($post->load('author'));
  }
}
