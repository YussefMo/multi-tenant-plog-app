<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read string $slug
 * @property-read string|null $stripe_product_id
 * @property-read string|null $stripe_price_id
 * @property-read int $amount
 * @property-read string $currency
 * @property-read string $interval
 * @property-read array<string, mixed> $features
 * @property-read array<string, int> $limits
 * @property-read bool $is_active
 * @property-read \Illuminate\Support\Carbon|null $created_at
 */
class PlanResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'name' => $this->name,
      'slug' => $this->slug,
      'stripe_product_id' => $this->stripe_product_id,
      'stripe_price_id' => $this->stripe_price_id,
      'amount' => $this->amount,
      'currency' => $this->currency,
      'interval' => $this->interval,
      'features' => $this->features ?? [],
      'limits' => $this->limits ?? [],
      'is_active' => $this->is_active,
      'created_at' => $this->created_at?->toIso8601String(),
    ];
  }
}
