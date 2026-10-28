<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read string|null $description
 * @property-read array<int, string> $permissions
 * @property-read int|null $users_count
 * @property-read \Illuminate\Support\Carbon|null $created_at
 */
class PermissionProfileResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'name' => $this->name,
      'description' => $this->description,
      'permissions' => $this->permissions ?? [],
      'users_count' => $this->whenCounted('users'),
      'created_at' => $this->created_at?->toIso8601String(),
    ];
  }
}
