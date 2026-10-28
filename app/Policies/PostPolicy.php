<?php

namespace App\Policies;

use App\Enums\PostStatus;
use App\Models\Post;
use App\Models\User;

class PostPolicy
{
  public function viewAny(User $user): bool
  {
    return $user->hasAnyPermission([
      'posts.view.any',
      'posts.view.own',
      'posts.view.published',
    ]);
  }

  public function view(User $user, Post $post): bool
  {
    $isSameTenant = $user->tenant_id === null || $post->tenant_id === $user->tenant_id;

    if ($isSameTenant) {
      if ($user->hasPermission('posts.view.any')) {
        return true;
      }

      if ($user->hasPermission('posts.view.own') && $post->user_id === $user->id) {
        return true;
      }
    }

    return $user->hasPermission('posts.view.published')
      && $post->status === PostStatus::Published;
  }

  public function create(User $user): bool
  {
    return $user->hasPermission('posts.create');
  }

  public function update(User $user, Post $post): bool
  {
    if ($post->tenant_id !== $user->tenant_id) {
      return false;
    }

    if ($user->hasPermission('posts.update.any')) {
      return true;
    }

    return $user->hasPermission('posts.update.own') && $post->user_id === $user->id;
  }

  public function delete(User $user, Post $post): bool
  {
    if ($post->tenant_id !== $user->tenant_id) {
      return false;
    }

    if ($user->hasPermission('posts.delete.any')) {
      return true;
    }

    return $user->hasPermission('posts.delete.own') && $post->user_id === $user->id;
  }

  public function publish(User $user, Post $post): bool
  {
    if ($post->tenant_id !== $user->tenant_id || ! $user->hasPermission('posts.publish')) {
      return false;
    }

    if ($user->hasPermission('posts.update.any')) {
      return true;
    }

    return $user->hasPermission('posts.update.own') && $post->user_id === $user->id;
  }
}
