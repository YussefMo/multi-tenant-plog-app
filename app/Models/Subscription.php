<?php

namespace App\Models;

use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int|null $plan_id
 * @property string|null $stripe_customer_id
 * @property string|null $stripe_subscription_id
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $current_period_start
 * @property \Illuminate\Support\Carbon|null $current_period_end
 * @property \Illuminate\Support\Carbon|null $trial_ends_at
 * @property bool $cancel_at_period_end
 * @property \App\Models\Tenant $tenant
 * @property \App\Models\Plan|null $plan
 */
#[Fillable([
  'tenant_id',
  'plan_id',
  'stripe_customer_id',
  'stripe_subscription_id',
  'status',
  'current_period_start',
  'current_period_end',
  'trial_ends_at',
  'cancel_at_period_end',
])]
class Subscription extends Model
{
  /** @use HasFactory<SubscriptionFactory> */
  use HasFactory;

  protected $attributes = [
    'status' => 'incomplete',
    'cancel_at_period_end' => false,
  ];

  protected function casts(): array
  {
    return [
      'current_period_start' => 'datetime',
      'current_period_end' => 'datetime',
      'trial_ends_at' => 'datetime',
      'cancel_at_period_end' => 'boolean',
    ];
  }

  public function tenant(): BelongsTo
  {
    return $this->belongsTo(Tenant::class);
  }

  public function plan(): BelongsTo
  {
    return $this->belongsTo(Plan::class);
  }

  public function isActive(): bool
  {
    return in_array($this->status, ['active', 'trialing'], true);
  }
}
