<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $email
 * @property UserRole $role
 * @property array<int, string> $permissions
 * @property string $token_hash
 * @property \Illuminate\Support\Carbon $expires_at
 * @property \Illuminate\Support\Carbon|null $accepted_at
 * @property \App\Models\Tenant $tenant
 */
#[Fillable(['email', 'role', 'permissions', 'token_hash', 'expires_at', 'accepted_at'])]
class TenantInvitation extends Model
{
  protected $attributes = [
    'permissions' => '[]',
  ];

  protected function casts(): array
  {
    return [
      'role' => UserRole::class,
      'permissions' => 'array',
      'expires_at' => 'datetime',
      'accepted_at' => 'datetime',
    ];
  }

  public function tenant(): BelongsTo
  {
    return $this->belongsTo(Tenant::class);
  }

  public function isExpired(): bool
  {
    return $this->accepted_at !== null || $this->expires_at->isPast();
  }
}
