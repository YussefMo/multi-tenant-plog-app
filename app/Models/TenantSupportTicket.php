<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $owner_id
 * @property string $token_hash
 * @property \Illuminate\Support\Carbon $expires_at
 * @property \Illuminate\Support\Carbon|null $used_at
 * @property \App\Models\Tenant $tenant
 */
#[Fillable(['token_hash', 'expires_at', 'used_at'])]
class TenantSupportTicket extends Model
{
  protected function casts(): array
  {
    return [
      'expires_at' => 'datetime',
      'used_at' => 'datetime',
    ];
  }

  public function tenant(): BelongsTo
  {
    return $this->belongsTo(Tenant::class);
  }

  public function isExpired(): bool
  {
    return $this->used_at !== null || $this->expires_at->isPast();
  }
}
