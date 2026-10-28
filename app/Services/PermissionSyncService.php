<?php

namespace App\Services;

use App\Models\PermissionProfile;
use App\Models\User;

class PermissionSyncService
{
  public function sync(User $user): User
  {
    $profilePermissions = data_get($user, 'profile.permissions', []);

    $permissions = $user->is_support
      ? ['*']
      : array_values(array_unique([
        ...($user->role?->permissions() ?? []),
        ...((array) $profilePermissions),
        ...($user->extra_permissions ?? []),
      ]));

    $user->forceFill(['permissions' => $permissions])->saveQuietly();

    return $user;
  }

  public function syncUsersForProfile(PermissionProfile $profile): void
  {
    $profile->users()
      ->where('is_support', false)
      ->chunkById(100, function ($users): void {
        foreach ($users as $user) {
          if ($user instanceof User) {
            $this->sync($user);
          }
        }
      });
  }

  public function syncAll(?int $tenantId = null): int
  {
    $count = 0;

    User::query()
      ->when($tenantId !== null, fn ($query) => $query->where('tenant_id', $tenantId))
      ->chunkById(100, function ($users) use (&$count): void {
        foreach ($users as $user) {
          $this->sync($user);
          $count++;
        }
      });

    return $count;
  }
}
