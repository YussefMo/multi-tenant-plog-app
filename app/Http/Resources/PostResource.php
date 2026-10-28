<?php

namespace App\Http\Resources;

use App\Enums\PostStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read int $tenant_id
 * @property-read int $user_id
 * @property-read string $title
 * @property-read string $slug
 * @property-read string $body
 * @property-read PostStatus $status
 * @property-read \Illuminate\Support\Carbon|null $published_at
 * @property-read User|null $author
 * @property-read \Illuminate\Support\Carbon|null $created_at
 * @property-read \Illuminate\Support\Carbon|null $updated_at
 */
class PostResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'tenant_id' => $this->tenant_id,
      'title' => $this->title,
      'slug' => $this->slug,
      'body' => $this->body,
      'status' => $this->status?->value,
      'published_at' => $this->published_at?->toIso8601String(),
      'author' => $this->whenLoaded(
        'author',
        fn () => $this->author ? [
          'id' => $this->author->id,
          'name' => $this->author->name,
          'role' => $this->author->role?->value,
        ] : null,
      ),
      'created_at' => $this->created_at?->toIso8601String(),
      'updated_at' => $this->updated_at?->toIso8601String(),
    ];
  }
}
