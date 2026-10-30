<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class TenantTrialService
{
  public function start(Tenant $tenant): Subscription
  {
    abort_if($tenant->trial_used_at !== null, 422, 'This tenant has already used its trial.');
    abort_if($tenant->subscription()->exists(), 422, 'This tenant already has a subscription.');

    return DB::transaction(function () use ($tenant): Subscription {
      $trialDays = max(1, (int) config('billing.trial_days', 14));
      $tenant->forceFill([
        'trial_used_at' => now(),
        'is_due' => false,
      ])->save();

      $subscription = new Subscription([
        'tenant_id' => $tenant->id,
        'status' => 'trialing',
        'current_period_start' => now(),
        'current_period_end' => now()->addDays($trialDays),
        'trial_ends_at' => now()->addDays($trialDays),
        'cancel_at_period_end' => false,
      ]);
      $subscription->save();

      return $subscription;
    });
  }
}
