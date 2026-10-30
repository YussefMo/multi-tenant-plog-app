<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\TenantPurgeService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

#[Signature('tenants:purge
  {--days=30 : Number of retention days after deletion}
  {--dry-run : List trashed tenants and their purge dates without deleting}')]
#[Description('Permanently remove tenants deleted beyond the retention window')]
class PurgeTenantsCommand extends Command
{
  public function handle(TenantPurgeService $purgeService): int
  {
    $days = max(0, (int) $this->option('days'));
    $cutoff = now()->subDays($days);

    if ($this->option('dry-run')) {
      return $this->listPendingPurges($days, $cutoff);
    }

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

  private function listPendingPurges(int $days, Carbon $cutoff): int
  {
    $tenants = Tenant::onlyTrashed()
      ->orderBy('deleted_at')
      ->get(['id', 'owner_id', 'name', 'deleted_at']);

    if ($tenants->isEmpty()) {
      $this->info('No trashed tenants.');

      return self::SUCCESS;
    }

    $eligible = 0;

    $rows = $tenants->map(function (Tenant $tenant) use ($days, $cutoff, &$eligible): array {
      $purgeAt = $tenant->deleted_at?->copy()->addDays($days);
      $isEligible = $tenant->deleted_at !== null && $tenant->deleted_at->lessThanOrEqualTo($cutoff);

      if ($isEligible) {
        $eligible++;
      }

      return [
        $tenant->id,
        $tenant->name,
        $tenant->owner_id,
        $tenant->deleted_at?->toDateTimeString() ?? '—',
        $purgeAt?->toDateTimeString() ?? '—',
        $isEligible ? 'Ready now' : ($purgeAt?->diffForHumans(now(), ['parts' => 1]) ?? '—'),
      ];
    })->all();

    $this->table(['ID', 'Tenant', 'Owner', 'Deleted at', 'Purge at', 'Status'], $rows);
    $this->line("Retention: {$days} day(s). The scheduler runs daily; eligible tenants are removed on the next run.");
    $this->line("Eligible now: {$eligible} of {$tenants->count()}.");

    return self::SUCCESS;
  }
}
