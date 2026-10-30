<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('tenants:mark-due')]
#[Description('Mark tenants as due when their trial has expired')]
class MarkTenantsDueCommand extends Command
{
  public function handle(): int
  {
    $count = 0;

    Subscription::query()
      ->where('status', 'trialing')
      ->whereNotNull('trial_ends_at')
      ->where('trial_ends_at', '<=', now())
      ->with('tenant')
      ->chunkById(100, function ($subscriptions) use (&$count): void {
        foreach ($subscriptions as $subscription) {
          $tenant = $subscription->tenant;

          if (! $tenant instanceof Tenant) {
            continue;
          }

          $tenant->forceFill(['is_due' => true])->saveQuietly();
          $subscription->forceFill(['status' => 'past_due'])->saveQuietly();
          $count++;
        }
      });

    $this->info("Marked {$count} tenant(s) due.");

    return self::SUCCESS;
  }
}
