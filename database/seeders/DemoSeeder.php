<?php

namespace Database\Seeders;

use App\Enums\PostStatus;
use App\Enums\UserRole;
use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\Owner;
use App\Models\PermissionProfile;
use App\Models\Plan;
use App\Models\Post;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantPurge;
use App\Models\TenantSupportAccess;
use App\Models\TenantSupportTicket;
use App\Models\User;
use App\Services\PermissionSyncService;
use App\Services\SupportUserService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DemoSeeder extends Seeder
{
  private const DEMO_PASSWORD = 'password';

  public function run(): void
  {
    $this->call(PlanSeeder::class);

    $planOne = Plan::query()->where('slug', 'plan-1')->firstOrFail();
    $planTwo = Plan::query()->where('slug', 'plan-2')->firstOrFail();

    $owner = $this->owner();

    [$tenantOne, $adminOne, $authorOne] = $this->tenant(
      owner: $owner,
      name: 'Demo Tenant',
      category: 'Technology',
      adminEmail: 'admin@demo.test',
      authorEmail: 'author@demo.test',
      allowSupport: true,
      isDue: false,
      postCounts: [40, 6, 4],
    );

    [$tenantTwo, $adminTwo, $authorTwo] = $this->tenant(
      owner: $owner,
      name: 'Demo Studio',
      category: 'Design',
      adminEmail: 'admin2@demo.test',
      authorEmail: 'author2@demo.test',
      allowSupport: true,
      isDue: false,
      postCounts: [40, 6, 4],
      trialUsedAt: now()->subDays(3),
    );

    [$tenantThree, $adminThree, $authorThree] = $this->tenant(
      owner: $owner,
      name: 'Northwind Labs',
      category: 'Health',
      adminEmail: 'admin3@demo.test',
      authorEmail: 'author3@demo.test',
      allowSupport: false,
      isDue: true,
      postCounts: [16, 3, 1],
      trialUsedAt: now()->subDays(40),
    );

    [$tenantFour, $adminFour, $authorFour] = $this->tenant(
      owner: $owner,
      name: 'Acme Corp',
      category: 'Engineering',
      adminEmail: 'admin4@demo.test',
      authorEmail: 'author4@demo.test',
      allowSupport: true,
      isDue: false,
      postCounts: [9, 2, 1],
    );

    [$tenantFive, $adminFive] = $this->tenant(
      owner: $owner,
      name: 'Legacy Media',
      category: 'Finance',
      adminEmail: 'admin5@demo.test',
      authorEmail: null,
      allowSupport: false,
      isDue: false,
      postCounts: [4, 1, 1],
      deletedAt: now()->subDays(10),
    );

    $reviewer = $this->profile(
      $tenantOne,
      'Reviewer',
      'Can review and publish any tenant post.',
      ['posts.view.any', 'posts.publish'],
    );

    $this->user(
      email: 'manager@demo.test',
      name: 'Demo Tenant Manager',
      role: UserRole::Admin,
      tenant: $tenantOne,
      profile: null,
      isTenantOwner: false,
    );

    $this->user(
      email: 'power@demo.test',
      name: 'Demo Tenant Power Author',
      role: UserRole::Author,
      tenant: $tenantOne,
      profile: $reviewer,
      extraPermissions: ['*'],
    );

    $pending = $this->user(
      email: 'pending@demo.test',
      name: 'Pending Tenant Admin',
      role: UserRole::Admin,
      tenant: $tenantOne,
      profile: null,
      password: null,
    );

    $expired = $this->user(
      email: 'expired@demo.test',
      name: 'Expired Tenant Admin',
      role: UserRole::Admin,
      tenant: $tenantTwo,
      profile: null,
      password: null,
    );

    $this->user(
      email: 'viewer@demo.test',
      name: 'Demo Viewer',
      role: UserRole::User,
      tenant: null,
      profile: null,
    );

    $supportOne = app(SupportUserService::class)->forTenant($tenantOne);
    $supportTwo = app(SupportUserService::class)->forTenant($tenantTwo);
    app(SupportUserService::class)->forTenant($tenantFour);

    $this->invitations($tenantOne, $tenantTwo, $pending, $expired);
    $this->supportAudit($owner, $tenantOne, $tenantTwo, $supportOne, $supportTwo);
    $this->purgedHistory($owner);

    $this->posts($tenantOne, $adminOne, $authorOne, [40, 6, 4]);
    $this->posts($tenantTwo, $adminTwo, $authorTwo, [40, 6, 4]);
    $this->posts($tenantThree, $adminThree, $authorThree, [16, 3, 1]);
    $this->posts($tenantFour, $adminFour, $authorFour, [9, 2, 1]);
    $this->posts($tenantFive, $adminFive, $adminFive, [4, 1, 1]);

    $this->billing($tenantOne, $planOne, 'active', 12, false, null, false);
    $this->billing($tenantTwo, $planTwo, 'trialing', 6, false, now()->addDays(14), false);
    $this->billing($tenantThree, $planOne, 'past_due', 3, true, null, false);
    $this->billing($tenantFour, $planTwo, 'active', 6, false, null, false);
    $this->billing($tenantFive, $planOne, 'canceled', 3, false, null, true);

    $this->command?->info('Seeded 4 active tenants, 1 deleted tenant, 1 purged audit, 17 users, 138 posts, 6 profiles, 5 subscriptions, 30 invoices/payments, 3 invitations.');
    $this->command?->info('Logins: owner@demo.test / password, admin@demo.test / password, viewer@demo.test / password.');
    $this->command?->info('Pending invitation token: demo-pending-token for pending@demo.test.');
    $this->command?->info('Support ticket: demo-support-ticket for Demo Tenant.');
  }

  private function owner(): Owner
  {
    $owner = Owner::query()->orderBy('id')->first();

    if ($owner instanceof Owner) {
      return $owner;
    }

    return Owner::query()->updateOrCreate(
      ['email' => 'owner@demo.test'],
      ['name' => 'Demo Owner', 'password' => self::DEMO_PASSWORD, 'is_active' => true],
    );
  }

  /**
   * @param  array{0: int, 1: int, 2: int}  $postCounts
   * @return array{0: Tenant, 1: User, 2: User}
   */
  private function tenant(
    Owner $owner,
    string $name,
    string $category,
    string $adminEmail,
    ?string $authorEmail,
    bool $allowSupport,
    bool $isDue,
    array $postCounts,
    ?Carbon $deletedAt = null,
    ?Carbon $trialUsedAt = null,
  ): array {
    $tenant = Tenant::withTrashed()->firstOrNew(['name' => $name]);
    $tenant->fill([
      'name' => $name,
      'category' => $category,
      'allow_support' => $allowSupport,
      'is_due' => $isDue,
    ]);
    $tenant->owner_id = $owner->id;
    $tenant->deleted_at = $deletedAt;
    $tenant->trial_used_at = $trialUsedAt;
    $tenant->save();

    $tenant->forceFill(['stripe_customer_id' => "cus_demo_{$tenant->id}"])->saveQuietly();

    $editor = $this->profile(
      $tenant,
      'Editor',
      'Can review and edit any tenant post.',
      ['posts.view.any', 'posts.update.any'],
    );

    $admin = $this->user(
      email: $adminEmail,
      name: "{$name} Admin",
      role: UserRole::Admin,
      tenant: $tenant,
      profile: null,
      isTenantOwner: true,
    );

    $author = $authorEmail !== null
      ? $this->user(
        email: $authorEmail,
        name: "{$name} Author",
        role: UserRole::Author,
        tenant: $tenant,
        profile: $editor,
      )
      : $admin;

    return [$tenant, $admin, $author];
  }

  private function profile(
    Tenant $tenant,
    string $name,
    string $description,
    array $permissions,
  ): PermissionProfile {
    $profile = PermissionProfile::query()->firstOrNew([
      'tenant_id' => $tenant->id,
      'name' => $name,
    ]);
    $profile->fill([
      'description' => $description,
      'permissions' => $permissions,
    ]);
    $profile->tenant_id = $tenant->id;
    $profile->save();

    return $profile;
  }

  /**
   * @param  array<int, string>  $extraPermissions
   */
  private function user(
    string $email,
    string $name,
    UserRole $role,
    ?Tenant $tenant,
    ?PermissionProfile $profile,
    bool $isTenantOwner = false,
    array $extraPermissions = [],
    ?string $password = self::DEMO_PASSWORD,
  ): User {
    $user = User::query()->firstOrNew(['email' => $email]);
    $user->fill([
      'name' => $name,
      'password' => $password,
      'role' => $role,
      'permission_profile_id' => $profile?->id,
      'extra_permissions' => $extraPermissions,
    ]);
    $user->tenant_id = $tenant?->id;
    $user->permissions = [];
    $user->is_support = false;
    $user->is_tenant_owner = $tenant !== null && $role === UserRole::Admin && $isTenantOwner;
    $user->email_verified_at = $password !== null ? now() : null;
    $user->save();

    app(PermissionSyncService::class)->sync($user);

    return $user;
  }

  private function invitations(Tenant $tenantOne, Tenant $tenantTwo, User $pending, User $expired): void
  {
    $this->invitation(
      $tenantOne,
      'author@demo.test',
      UserRole::Author,
      'demo-accepted-token',
      now()->addDays(5),
      now()->subDays(20),
    );

    $this->invitation(
      $tenantOne,
      $pending->email,
      UserRole::Admin,
      'demo-pending-token',
      now()->addDays(5),
      null,
    );

    $this->invitation(
      $tenantTwo,
      $expired->email,
      UserRole::Admin,
      'demo-expired-token',
      now()->subDays(2),
      null,
    );
  }

  private function invitation(
    Tenant $tenant,
    string $email,
    UserRole $role,
    string $token,
    Carbon $expiresAt,
    ?Carbon $acceptedAt,
  ): void {
    $invitation = TenantInvitation::query()->firstOrNew([
      'tenant_id' => $tenant->id,
      'email' => $email,
    ]);
    $invitation->fill([
      'role' => $role,
      'permissions' => $role->permissions(),
      'token_hash' => hash('sha256', $token),
      'expires_at' => $expiresAt,
      'accepted_at' => $acceptedAt,
    ]);
    $invitation->tenant_id = $tenant->id;
    $invitation->save();
  }

  private function supportAudit(
    Owner $owner,
    Tenant $tenantOne,
    Tenant $tenantTwo,
    User $supportOne,
    User $supportTwo,
  ): void {
    $ticketToken = 'demo-support-ticket';

    $ticket = TenantSupportTicket::query()->firstOrNew([
      'tenant_id' => $tenantOne->id,
      'token_hash' => hash('sha256', $ticketToken),
    ]);
    $ticket->fill([
      'expires_at' => now()->addMinutes(5),
      'used_at' => null,
    ]);
    $ticket->tenant_id = $tenantOne->id;
    $ticket->owner_id = $owner->id;
    $ticket->save();

    TenantSupportAccess::query()
      ->where('tenant_id', $tenantTwo->id)
      ->where('ip_address', '127.0.0.1')
      ->delete();

    $access = new TenantSupportAccess([
      'impersonated_user_id' => $supportTwo->id,
      'started_at' => now()->subDays(2)->setTime(10, 0),
      'ended_at' => now()->subDays(2)->setTime(10, 12),
      'ip_address' => '127.0.0.1',
    ]);
    $access->tenant_id = $tenantTwo->id;
    $access->owner_id = $owner->id;
    $access->save();

    $unused = new TenantSupportAccess([
      'impersonated_user_id' => $supportOne->id,
      'started_at' => now()->subDays(5)->setTime(9, 0),
      'ended_at' => now()->subDays(5)->setTime(9, 5),
      'ip_address' => '127.0.0.1',
    ]);
    $unused->tenant_id = $tenantOne->id;
    $unused->owner_id = $owner->id;
    $unused->save();
  }

  private function purgedHistory(Owner $owner): void
  {
    TenantPurge::query()->updateOrCreate(
      ['tenant_id' => 999],
      [
        'owner_id' => $owner->id,
        'tenant_name' => 'Archived Brand',
        'admin_email' => 'old@demo.test',
        'purged_by_owner_id' => $owner->id,
        'purged_at' => now()->subDays(45),
        'snapshot' => [
          'tenant' => [
            'name' => 'Archived Brand',
            'category' => 'Marketing',
          ],
          'counts' => [
            'users' => 1,
            'posts' => 3,
          ],
        ],
      ],
    );
  }

  /**
   * @param  array{0: int, 1: int, 2: int}  $counts
   */
  private function posts(Tenant $tenant, User $admin, User $author, array $counts): void
  {
    [$publishedCount, $draftCount, $archivedCount] = $counts;

    Post::withTrashed()
      ->where('tenant_id', $tenant->id)
      ->forceDelete();

    $total = $publishedCount + $draftCount + $archivedCount;

    for ($index = 1; $index <= $total; $index++) {
      $status = match (true) {
        $index <= $publishedCount => PostStatus::Published,
        $index <= $publishedCount + $draftCount => PostStatus::Draft,
        default => PostStatus::Archived,
      };

      $post = new Post([
        'title' => "Demo Post {$tenant->id}-{$index}: ".fake()->sentence(5),
        'body' => $this->body(),
        'status' => $status,
        'published_at' => $status === PostStatus::Published
          ? now()->subDays($publishedCount - $index + 1)->subMinutes($index)
          : null,
      ]);
      $post->tenant_id = $tenant->id;
      $post->user_id = $index % 4 === 0 ? $admin->id : $author->id;
      $post->save();
    }
  }

  private function body(): string
  {
    $sections = [
      'Overview',
      'Why this matters',
      'What changed',
      'Implementation notes',
      'Examples',
      'Results',
      'Trade-offs',
      'Next steps',
    ];

    $blocks = [];

    foreach ($sections as $section) {
      $blocks[] = "## {$section}\n\n".fake()->paragraphs(3, true);
    }

    return implode("\n\n", $blocks);
  }

  private function billing(
    Tenant $tenant,
    Plan $plan,
    string $status,
    int $months,
    bool $isDue,
    ?Carbon $trialEndsAt,
    bool $cancelAtPeriodEnd,
  ): void {
    BillingInvoice::query()->where('tenant_id', $tenant->id)->delete();
    BillingPayment::query()->where('tenant_id', $tenant->id)->delete();

    Subscription::query()->updateOrCreate(
      ['tenant_id' => $tenant->id],
      [
        'plan_id' => $plan->id,
        'stripe_customer_id' => "cus_demo_{$tenant->id}",
        'stripe_subscription_id' => "sub_demo_{$tenant->id}",
        'status' => $status,
        'current_period_start' => now()->startOfMonth(),
        'current_period_end' => now()->addMonth()->startOfMonth(),
        'trial_ends_at' => $trialEndsAt,
        'cancel_at_period_end' => $cancelAtPeriodEnd,
      ],
    );

    $tenant->forceFill([
      'is_due' => $isDue,
      'stripe_customer_id' => "cus_demo_{$tenant->id}",
    ])->saveQuietly();

    for ($month = 0; $month < $months; $month++) {
      $date = now()
        ->startOfMonth()
        ->subMonths($months - 1 - $month)
        ->addDays(5 + (($month * 3) % 12))
        ->setTime(10, 0);

      $invoiceId = "in_demo_{$tenant->id}_{$date->format('Y_m')}";
      $chargeId = "ch_demo_{$tenant->id}_{$date->format('Y_m')}";

      [$invoiceStatus, $paymentStatus] = $this->billingStatuses($status, $month, $months);

      $amount = $plan->amount;
      $amountRefunded = match ($paymentStatus) {
        'partially_refunded' => intdiv($amount, 5),
        'refunded' => $amount,
        default => 0,
      };

      $isPaid = $invoiceStatus === 'paid';

      BillingInvoice::query()->updateOrCreate(
        ['stripe_invoice_id' => $invoiceId],
        [
          'tenant_id' => $tenant->id,
          'stripe_customer_id' => "cus_demo_{$tenant->id}",
          'stripe_subscription_id' => "sub_demo_{$tenant->id}",
          'status' => $invoiceStatus,
          'currency' => $plan->currency,
          'subtotal' => $amount,
          'tax' => 0,
          'total' => $amount,
          'amount_paid' => $isPaid ? $amount : 0,
          'amount_due' => $isPaid ? 0 : $amount,
          'hosted_invoice_url' => "https://invoice.stripe.test/{$invoiceId}",
          'invoice_pdf' => "https://invoice.stripe.test/{$invoiceId}.pdf",
          'period_start' => $date->copy()->startOfMonth(),
          'period_end' => $date->copy()->endOfMonth(),
          'paid_at' => $isPaid ? $date : null,
        ],
      );

      BillingPayment::query()->updateOrCreate(
        ['stripe_charge_id' => $chargeId],
        [
          'tenant_id' => $tenant->id,
          'stripe_payment_intent_id' => "pi_demo_{$tenant->id}_{$date->format('Y_m')}",
          'stripe_invoice_id' => $invoiceId,
          'amount' => $amount,
          'amount_refunded' => $amountRefunded,
          'currency' => $plan->currency,
          'status' => $paymentStatus,
          'paid_at' => $isPaid ? $date : null,
        ],
      );
    }
  }

  /**
   * @return array{0: string, 1: string}
   */
  private function billingStatuses(string $status, int $month, int $months): array
  {
    if ($status === 'past_due') {
      return match ($month) {
        0 => ['open', 'failed'],
        1 => ['uncollectible', 'failed'],
        default => ['paid', 'succeeded'],
      };
    }

    if ($status === 'canceled') {
      return $month === $months - 1
        ? ['paid', 'refunded']
        : ['paid', 'succeeded'];
    }

    if ($status === 'active' && $months >= 12) {
      $invoiceStatus = match ($month) {
        3 => 'open',
        7 => 'uncollectible',
        default => 'paid',
      };

      $paymentStatus = match ($month) {
        3 => 'failed',
        6 => 'partially_refunded',
        9 => 'disputed',
        10 => 'refunded',
        default => 'succeeded',
      };

      return [$invoiceStatus, $paymentStatus];
    }

    return ['paid', 'succeeded'];
  }
}
