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
 * @property-read \Illuminate\Support\Carbon|null $deleted_at
 * @property-read \Illuminate\Support\Carbon|null $created_at
 * @property-read \App\Models\User|null $admin
 * @property-read \App\Models\TenantInvitation|null $latestInvitation
 * @property-read \App\Models\Subscription|null $subscription
 * @property-read int|null $users_count
 * @property-read int|null $posts_count
 */
class TenantDetailResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'name' => $this->name,
      'category' => $this->category,
      'allow_support' => $this->allow_support,
      'is_due' => $this->is_due,
      'deleted_at' => $this->deleted_at?->toIso8601String(),
      'created_at' => $this->created_at?->toIso8601String(),
      'admin' => $this->whenLoaded('admin', fn () => $this->admin ? [
        'id' => $this->admin->id,
        'name' => $this->admin->name,
        'email' => $this->admin->email,
        'role' => $this->admin->role?->value,
        'created_at' => $this->admin->created_at?->toIso8601String(),
      ] : null),
      'invitation' => $this->whenLoaded('latestInvitation', fn () => $this->latestInvitation ? [
        'email' => $this->latestInvitation->email,
        'expires_at' => $this->latestInvitation->expires_at?->toIso8601String(),
        'accepted_at' => $this->latestInvitation->accepted_at?->toIso8601String(),
      ] : null),
      'subscription' => $this->whenLoaded('subscription', fn () => $this->subscription ? [
        'id' => $this->subscription->id,
        'status' => $this->subscription->status,
        'plan' => $this->subscription->plan ? [
          'id' => $this->subscription->plan->id,
          'name' => $this->subscription->plan->name,
        ] : null,
        'current_period_end' => $this->subscription->current_period_end?->toIso8601String(),
        'cancel_at_period_end' => $this->subscription->cancel_at_period_end,
      ] : null),
      'counts' => [
        'users' => (int) ($this->users_count ?? 0),
        'posts' => (int) ($this->posts_count ?? 0),
      ],
    ];
  }
}
