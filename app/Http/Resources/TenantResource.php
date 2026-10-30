<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read string|null $category
 * @property-read bool $allow_support
 * @property-read bool $is_due
 * @property-read \Illuminate\Support\Carbon|null $trial_used_at
 * @property-read \Illuminate\Support\Carbon|null $deleted_at
 * @property-read \Illuminate\Support\Carbon|null $created_at
 */
class TenantResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'name' => $this->name,
      'category' => $this->category,
      'allow_support' => $this->allow_support,
      'is_due' => $this->is_due,
      'trial_used_at' => $this->trial_used_at?->toIso8601String(),
      'deleted_at' => $this->deleted_at?->toIso8601String(),
      'created_at' => $this->created_at?->toIso8601String(),
    ];
  }
}
