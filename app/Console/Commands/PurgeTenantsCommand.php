<?php

namespace App\Console\Commands;

use App\Models\PermissionProfile;
use App\Models\Post;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantSupportAccess;
use App\Models\TenantSupportTicket;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('tenants:purge
  {--days=30 : Number of retention days after deletion}')]
#[Description('Permanently remove tenants deleted beyond the retention window')]
class PurgeTenantsCommand extends Command
{
  public function handle(): int
  {
    $days = max(0, (int) $this->option('days'));
    $cutoff = now()->subDays($days);
    $purged = 0;

    Tenant::onlyTrashed()
      ->where('deleted_at', '<=', $cutoff)
      ->orderBy('id')
      ->chunkById(50, function ($tenants) use (&$purged): void {
        foreach ($tenants as $tenant) {
          if (! $tenant instanceof Tenant) {
            continue;
          }

          $this->purge($tenant);
          $purged++;
        }
      });

    $this->info("Purged {$purged} tenant(s).");

    return self::SUCCESS;
  }

  private function purge(Tenant $tenant): void
  {
    DB::transaction(function () use ($tenant): void {
      $users = User::query()
        ->where('tenant_id', $tenant->id)
        ->get(['id', 'email']);

      DB::table('sessions')->whereIn('user_id', $users->pluck('id'))->delete();
      DB::table('password_reset_tokens')->whereIn('email', $users->pluck('email'))->delete();

      TenantSupportAccess::query()->where('tenant_id', $tenant->id)->delete();
      TenantSupportTicket::query()->where('tenant_id', $tenant->id)->delete();
      TenantInvitation::query()->where('tenant_id', $tenant->id)->delete();

      Post::withTrashed()
        ->where('tenant_id', $tenant->id)
        ->forceDelete();

      User::query()->where('tenant_id', $tenant->id)->delete();
      PermissionProfile::query()->where('tenant_id', $tenant->id)->delete();

      $tenant->forceDelete();
    });

    $this->line("Purged tenant {$tenant->id}.");
  }
}
