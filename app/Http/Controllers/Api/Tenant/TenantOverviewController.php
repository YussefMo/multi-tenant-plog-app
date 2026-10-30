<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Models\PermissionProfile;
use App\Models\Post;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantOverviewController extends Controller
{
  public function show(Request $request): JsonResponse
  {
    $user = $request->user();
    abort_unless($user instanceof User, 401);

    $tenant = $user->tenant;
    abort_unless($tenant instanceof Tenant, 404);

    $subscription = null;

    if ($user->hasPermission('billing.view')) {
      $current = $tenant->subscription()->with('plan')->first();

      $subscription = $current instanceof Subscription ? [
        'id' => $current->id,
        'status' => $current->status,
        'plan' => $current->plan ? [
          'id' => $current->plan->id,
          'name' => $current->plan->name,
        ] : null,
        'current_period_end' => $current->current_period_end?->toIso8601String(),
        'trial_ends_at' => $current->trial_ends_at?->toIso8601String(),
        'cancel_at_period_end' => $current->cancel_at_period_end,
      ] : null;
    }

    return response()->json([
      'data' => [
        'tenant' => [
          'id' => $tenant->id,
          'name' => $tenant->name,
          'category' => $tenant->category,
          'allow_support' => $tenant->allow_support,
          'is_due' => $tenant->is_due,
        ],
        'counts' => [
          'users' => $user->hasPermission('users.view')
            ? User::query()->where('tenant_id', $tenant->id)->where('is_support', false)->count()
            : null,
          'profiles' => $user->hasPermission('profiles.view')
            ? PermissionProfile::query()->where('tenant_id', $tenant->id)->count()
            : null,
          'posts' => $this->postCounts($user),
        ],
        'subscription' => $subscription,
      ],
    ]);
  }

  /**
   * @return array{total: int, draft: int, published: int, archived: int}
   */
  private function postCounts(User $user): array
  {
    $counts = Post::query()
      ->visibleTo($user)
      ->selectRaw('status, count(*) as aggregate')
      ->groupBy('status')
      ->pluck('aggregate', 'status');

    return [
      'total' => (int) $counts->sum(),
      'draft' => (int) ($counts[PostStatus::Draft->value] ?? 0),
      'published' => (int) ($counts[PostStatus::Published->value] ?? 0),
      'archived' => (int) ($counts[PostStatus::Archived->value] ?? 0),
    ];
  }
}
