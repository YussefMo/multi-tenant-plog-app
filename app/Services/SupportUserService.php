<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;

class SupportUserService
{
  public function forTenant(Tenant $tenant): User
  {
    $support = User::query()
      ->where('tenant_id', $tenant->id)
      ->where('is_support', true)
      ->first();

    if ($support) {
      return $support;
    }

    $support = new User([
      'name' => 'Owner Support',
      'email' => "support+{$tenant->id}@internal.invalid",
      'password' => null,
      'role' => UserRole::Admin,
      'extra_permissions' => [],
    ]);
    $support->tenant_id = $tenant->id;
    $support->is_support = true;
    $support->permissions = ['*'];
    $support->save();

    return $support;
  }
}
