<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\Owner;
use App\Models\PermissionProfile;
use App\Models\Post;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantPurge;
use App\Models\TenantSupportAccess;
use App\Models\TenantSupportTicket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TenantPurgeService
{
  /**
   * Permanently delete a trashed tenant, writing an immutable audit row first.
   */
  public function purge(Tenant $tenant, ?Owner $purgedBy = null): TenantPurge
  {
    return DB::transaction(function () use ($tenant, $purgedBy): TenantPurge {
      $users = User::query()
        ->where('tenant_id', $tenant->id)
        ->get(['id', 'name', 'email', 'role']);

      $admin = $users->first(fn (User $user): bool => $user->role === UserRole::Admin);
      $subscription = Subscription::query()
        ->with('plan:id,name')
        ->where('tenant_id', $tenant->id)
        ->first();

      $purge = new TenantPurge([
        'tenant_id' => $tenant->id,
        'owner_id' => $tenant->owner_id,
        'tenant_name' => $tenant->name,
        'admin_email' => $admin?->email,
        'purged_by_owner_id' => $purgedBy?->id,
        'purged_at' => now(),
        'snapshot' => [
          'tenant' => [
            'name' => $tenant->name,
            'category' => $tenant->category,
            'allow_support' => $tenant->allow_support,
            'is_due' => $tenant->is_due,
            'created_at' => $tenant->created_at?->toIso8601String(),
            'deleted_at' => $tenant->deleted_at?->toIso8601String(),
          ],
          'users' => $users
            ->map(fn (User $user): array => [
              'id' => $user->id,
              'name' => $user->name,
              'email' => $user->email,
              'role' => $user->role?->value,
            ])
            ->values()
            ->all(),
          'subscription' => $subscription ? [
            'id' => $subscription->id,
            'status' => $subscription->status,
            'plan' => $subscription->plan?->name,
            'current_period_end' => $subscription->current_period_end?->toIso8601String(),
          ] : null,
          'counts' => [
            'users' => $users->count(),
            'posts' => Post::withTrashed()->where('tenant_id', $tenant->id)->count(),
          ],
        ],
      ]);
      $purge->save();

      DB::table('sessions')->whereIn('user_id', $users->pluck('id'))->delete();
      DB::table('password_reset_tokens')->whereIn('email', $users->pluck('email'))->delete();

      TenantSupportAccess::query()->where('tenant_id', $tenant->id)->delete();
      TenantSupportTicket::query()->where('tenant_id', $tenant->id)->delete();
      TenantInvitation::query()->where('tenant_id', $tenant->id)->delete();

      Post::withTrashed()
        ->where('tenant_id', $tenant->id)
        ->forceDelete();

      BillingInvoice::query()->where('tenant_id', $tenant->id)->delete();
      BillingPayment::query()->where('tenant_id', $tenant->id)->delete();
      Subscription::query()->where('tenant_id', $tenant->id)->delete();

      User::query()->where('tenant_id', $tenant->id)->delete();
      PermissionProfile::query()->where('tenant_id', $tenant->id)->delete();

      $tenant->forceDelete();

      return $purge;
    });
  }
}
