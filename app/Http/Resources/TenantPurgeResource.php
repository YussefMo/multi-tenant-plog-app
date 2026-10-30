<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read int $tenant_id
 * @property-read int $owner_id
 * @property-read string $tenant_name
 * @property-read string|null $admin_email
 * @property-read int|null $purged_by_owner_id
 * @property-read \Illuminate\Support\Carbon|null $purged_at
 * @property-read array<string, mixed>|null $snapshot
 */
class TenantPurgeResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'tenant_id' => $this->tenant_id,
      'owner_id' => $this->owner_id,
      'tenant_name' => $this->tenant_name,
      'admin_email' => $this->admin_email,
      'purged_by_owner_id' => $this->purged_by_owner_id,
      'purged_at' => $this->purged_at?->toIso8601String(),
      'snapshot' => $this->snapshot,
    ];
  }
}
