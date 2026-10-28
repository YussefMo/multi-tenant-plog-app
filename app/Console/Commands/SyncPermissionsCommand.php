<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\PermissionSyncService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('permissions:sync
  {--tenant= : Tenant ID}
  {--user= : User ID}')]
#[Description('Recompute materialized user permissions')]
class SyncPermissionsCommand extends Command
{
  public function handle(PermissionSyncService $permissions): int
  {
    $userId = $this->option('user');

    if ($userId !== null) {
      $user = User::query()->findOrFail((int) $userId);
      $permissions->sync($user);
      $this->info("Synced user {$user->id}.");

      return self::SUCCESS;
    }

    $tenantId = $this->option('tenant');
    $count = $permissions->syncAll($tenantId !== null ? (int) $tenantId : null);

    $this->info("Synced {$count} users.");

    return self::SUCCESS;
  }
}
