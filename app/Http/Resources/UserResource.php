<?php

namespace App\Http\Resources;

use App\Enums\UserRole;
use App\Models\PermissionProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read int|null $tenant_id
 * @property-read string $name
 * @property-read string $email
 * @property-read UserRole $role
 * @property-read bool $is_tenant_owner
 * @property-read array<int, string> $permissions
 * @property-read array<int, string> $extra_permissions
 * @property-read PermissionProfile|null $profile
 * @property-read \App\Models\Tenant|null $tenant
 * @property-read \App\Models\TenantInvitation|null $latestInvitation
 * @property-read \Illuminate\Support\Carbon|null $created_at
 */
class UserResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'tenant_id' => $this->tenant_id,
      'name' => $this->name,
      'email' => $this->email,
      'role' => $this->role?->value,
      'is_tenant_owner' => (bool) $this->is_tenant_owner,
      'permissions' => $this->permissions ?? [],
      'extra_permissions' => $this->extra_permissions ?? [],
      'profile' => $this->whenLoaded(
        'profile',
        fn () => $this->profile ? new PermissionProfileResource($this->profile) : null,
      ),
      'tenant' => $this->whenLoaded(
        'tenant',
        fn () => $this->tenant ? new TenantResource($this->tenant) : null,
      ),
      'invitation' => $this->whenLoaded(
        'latestInvitation',
        fn () => $this->latestInvitation ? [
          'expires_at' => $this->latestInvitation->expires_at?->toIso8601String(),
          'accepted_at' => $this->latestInvitation->accepted_at?->toIso8601String(),
          'status' => $this->latestInvitation->accepted_at !== null
            ? 'accepted'
            : ($this->latestInvitation->expires_at->isPast() ? 'expired' : 'pending'),
        ] : null,
      ),
      'created_at' => $this->created_at?->toIso8601String(),
    ];
  }
}
