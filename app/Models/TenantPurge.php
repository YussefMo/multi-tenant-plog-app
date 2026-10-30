<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $owner_id
 * @property string $tenant_name
 * @property string|null $admin_email
 * @property int|null $purged_by_owner_id
 * @property \Illuminate\Support\Carbon|null $purged_at
 * @property array<string, mixed>|null $snapshot
 * @property \Illuminate\Support\Carbon|null $created_at
 */
#[Fillable([
  'tenant_id',
  'owner_id',
  'tenant_name',
  'admin_email',
  'purged_by_owner_id',
  'purged_at',
  'snapshot',
])]
class TenantPurge extends Model
{
  protected function casts(): array
  {
    return [
      'purged_at' => 'datetime',
      'snapshot' => 'array',
    ];
  }
}
