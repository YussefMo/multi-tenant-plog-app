<?php

namespace App\Models;

use App\Enums\PostStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $user_id
 * @property string $title
 * @property string $slug
 * @property string $body
 * @property PostStatus $status
 * @property \Illuminate\Support\Carbon|null $published_at
 * @property \App\Models\User $author
 * @property \App\Models\Tenant $tenant
 */
#[Fillable(['title', 'slug', 'body', 'status', 'published_at'])]
class Post extends Model
{
  use BelongsToTenant;
  use HasFactory;
  use SoftDeletes;

  protected $attributes = [
    'status' => 'draft',
  ];

  protected function casts(): array
  {
    return [
      'status' => PostStatus::class,
      'published_at' => 'datetime',
    ];
  }

  protected static function booted(): void
  {
    static::creating(function (Post $post): void {
      if (blank($post->slug)) {
        $post->slug = $post->uniqueSlug();
      }
    });
  }

  public function author(): BelongsTo
  {
    return $this->belongsTo(User::class, 'user_id');
  }

  public function scopeVisibleTo(Builder $query, User $user): Builder
  {
    if ($user->hasPermission('posts.view.any')) {
      return $query;
    }

    $canViewOwn = $user->hasPermission('posts.view.own');
    $canViewPublished = $user->hasPermission('posts.view.published');

    if (! $canViewOwn && ! $canViewPublished) {
      return $query->whereRaw('1 = 0');
    }

    return $query->where(function (Builder $query) use ($user, $canViewOwn, $canViewPublished): void {
      if ($canViewOwn) {
        $query->orWhere('user_id', $user->id);
      }

      if ($canViewPublished) {
        $query->orWhere('status', PostStatus::Published->value);
      }
    });
  }

  private function uniqueSlug(): string
  {
    $base = Str::limit(Str::slug($this->title), 200, '') ?: 'post';
    $slug = $base;
    $suffix = 2;

    while (static::withTrashed()
      ->where('tenant_id', $this->tenant_id)
      ->where('slug', $slug)
      ->exists()) {
      $slug = "{$base}-{$suffix}";
      $suffix++;
    }

    return $slug;
  }
}
