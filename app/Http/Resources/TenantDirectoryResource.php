<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Tenant
 *
 * @property-read int $id
 * @property-read string $name
 * @property-read string|null $category
 * @property-read int|null $published_posts_count
 */
class TenantDirectoryResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'name' => $this->name,
      'category' => $this->category,
      'published_posts_count' => $this->whenCounted('published_posts_count'),
    ];
  }
}
