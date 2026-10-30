<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\TenantPurgeService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('tenants:purge
  {--days=30 : Number of retention days after deletion}')]
#[Description('Permanently remove tenants deleted beyond the retention window')]
class PurgeTenantsCommand extends Command
{
  public function handle(TenantPurgeService $purgeService): int
  {
    $days = max(0, (int) $this->option('days'));
    $cutoff = now()->subDays($days);
    $purged = 0;

    Tenant::onlyTrashed()
      ->where('deleted_at', '<=', $cutoff)
      ->orderBy('id')
      ->chunkById(50, function ($tenants) use (&$purged, $purgeService): void {
        foreach ($tenants as $tenant) {
          if (! $tenant instanceof Tenant) {
            continue;
          }

          $purgeService->purge($tenant);
          $purged++;
        }
      });

    $this->info("Purged {$purged} tenant(s).");

    return self::SUCCESS;
  }
}
