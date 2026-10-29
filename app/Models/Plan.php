<?php

namespace App\Models;

use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $stripe_product_id
 * @property string|null $stripe_price_id
 * @property int $amount
 * @property string $currency
 * @property string $interval
 * @property array<string, mixed> $features
 * @property array<string, int> $limits
 * @property bool $is_active
 */
#[Fillable([
  'name',
  'slug',
  'stripe_product_id',
  'stripe_price_id',
  'amount',
  'currency',
  'interval',
  'features',
  'limits',
  'is_active',
])]
class Plan extends Model
{
  /** @use HasFactory<PlanFactory> */
  use HasFactory;

  protected $attributes = [
    'features' => '[]',
    'limits' => '[]',
    'is_active' => true,
  ];

  protected function casts(): array
  {
    return [
      'amount' => 'integer',
      'features' => 'array',
      'limits' => 'array',
      'is_active' => 'boolean',
    ];
  }

  public function subscriptions(): HasMany
  {
    return $this->hasMany(Subscription::class);
  }

  public function monthlyAmount(): int
  {
    return $this->interval === 'year'
      ? (int) round($this->amount / 12)
      : $this->amount;
  }

  public function limit(string $key): ?int
  {
    $limit = data_get($this->limits, $key);

    return $limit === null ? null : (int) $limit;
  }

  public function allows(string $limit, int $current): bool
  {
    $max = $this->limit($limit);

    return $max === null || $max < 0 || $current < $max;
  }
}
