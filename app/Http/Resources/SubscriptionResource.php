<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read int $tenant_id
 * @property-read int|null $plan_id
 * @property-read string|null $stripe_customer_id
 * @property-read string|null $stripe_subscription_id
 * @property-read string $status
 * @property-read \Illuminate\Support\Carbon|null $current_period_start
 * @property-read \Illuminate\Support\Carbon|null $current_period_end
 * @property-read \Illuminate\Support\Carbon|null $trial_ends_at
 * @property-read bool $cancel_at_period_end
 * @property-read \App\Models\Plan|null $plan
 * @property-read \Illuminate\Support\Carbon|null $created_at
 */
class SubscriptionResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'tenant_id' => $this->tenant_id,
      'plan_id' => $this->plan_id,
      'status' => $this->status,
      'stripe_customer_id' => $this->stripe_customer_id,
      'stripe_subscription_id' => $this->stripe_subscription_id,
      'current_period_start' => $this->current_period_start?->toIso8601String(),
      'current_period_end' => $this->current_period_end?->toIso8601String(),
      'trial_ends_at' => $this->trial_ends_at?->toIso8601String(),
      'cancel_at_period_end' => $this->cancel_at_period_end,
      'plan' => $this->whenLoaded(
        'plan',
        fn () => $this->plan ? new PlanResource($this->plan) : null,
      ),
      'features' => $this->plan->features ?? [],
      'limits' => $this->plan->limits ?? [],
      'created_at' => $this->created_at?->toIso8601String(),
    ];
  }
}
