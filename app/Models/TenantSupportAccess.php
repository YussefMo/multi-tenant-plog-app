<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $owner_id
 * @property int $impersonated_user_id
 * @property \Illuminate\Support\Carbon $started_at
 * @property \Illuminate\Support\Carbon|null $ended_at
 * @property string|null $ip_address
 * @property \App\Models\Tenant $tenant
 * @property \App\Models\User $impersonatedUser
 */
#[Fillable(['impersonated_user_id', 'started_at', 'ended_at', 'ip_address'])]
class TenantSupportAccess extends Model
{
  protected function casts(): array
  {
    return [
      'started_at' => 'datetime',
      'ended_at' => 'datetime',
    ];
  }

  public function tenant(): BelongsTo
  {
    return $this->belongsTo(Tenant::class);
  }

  public function impersonatedUser(): BelongsTo
  {
    return $this->belongsTo(User::class, 'impersonated_user_id');
  }
}
