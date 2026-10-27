<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read string $email
 * @property-read bool $is_active
 * @property-read \Illuminate\Support\Carbon|null $created_at
 */
class OwnerResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'name' => $this->name,
      'email' => $this->email,
      'is_active' => $this->is_active,
      'created_at' => $this->created_at?->toIso8601String(),
    ];
  }
}
