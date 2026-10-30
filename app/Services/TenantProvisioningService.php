<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Owner;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TenantProvisioningService
{
  public function __construct(private readonly TenantInvitationService $invitations)
  {
  }

  /**
   * @return array{tenant: Tenant, admin: User, invitation: TenantInvitation, token: string}
   */
  public function provision(Owner $owner, array $data): array
  {
    return DB::transaction(function () use ($owner, $data): array {
      $tenant = new Tenant([
        'name' => $data['name'],
        'category' => $data['category'] ?? null,
        'is_due' => true,
      ]);
      $tenant->owner_id = $owner->id;
      $tenant->save();

      $admin = new User([
        'name' => $data['admin_name'],
        'email' => $data['admin_email'],
        'password' => null,
        'role' => UserRole::Admin,
        'extra_permissions' => [],
      ]);
      $admin->tenant_id = $tenant->id;
      $admin->is_support = false;
      $admin->is_tenant_owner = true;
      $admin->permissions = ['*'];
      $admin->save();

      ['invitation' => $invitation, 'token' => $token] = $this->invitations->create($admin);

      return compact('tenant', 'admin', 'invitation', 'token');
    });
  }
}
