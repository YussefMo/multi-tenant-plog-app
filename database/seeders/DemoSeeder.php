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
use App\Models\User;
use App\Services\PermissionSyncService;
use App\Services\SupportUserService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DemoSeeder extends Seeder
{
  private const POSTS_PER_TENANT = 50;

  private const BILLING_MONTHS = 12;

  public function run(): void
  {
    $this->call(PlanSeeder::class);

    $planOne = Plan::query()->where('slug', 'plan-1')->firstOrFail();
    $planTwo = Plan::query()->where('slug', 'plan-2')->firstOrFail();

    $owner = Owner::query()->orderBy('id')->first();

    if (! $owner instanceof Owner) {
      $owner = Owner::query()->updateOrCreate(
        ['email' => 'owner@demo.test'],
        ['name' => 'Demo Owner', 'password' => 'password', 'is_active' => true],
      );
    }

    [$tenantOne, $adminOne, $authorOne] = $this->tenant(
      $owner,
      'Demo Tenant',
      'Technology',
      'admin@demo.test',
      'author@demo.test',
    );

    [$tenantTwo, $adminTwo, $authorTwo] = $this->tenant(
      $owner,
      'Demo Studio',
      'Design',
      'admin2@demo.test',
      'author2@demo.test',
    );

    $this->user('viewer@demo.test', 'Demo Viewer', UserRole::User, null, null);

    app(SupportUserService::class)->forTenant($tenantOne);
    app(SupportUserService::class)->forTenant($tenantTwo);

    $this->posts($tenantOne, $adminOne, $authorOne);
    $this->posts($tenantTwo, $adminTwo, $authorTwo);

    $this->billing($tenantOne, $planOne, 'active', null);
    $this->billing($tenantTwo, $planTwo, 'trialing', now()->addDays(14));

    $this->command?->info('Seeded 2 demo tenants, 100 posts, users, profiles, subscriptions, invoices, and payments.');
  }

  /**
   * @return array{0: Tenant, 1: User, 2: User}
   */
  private function tenant(
    Owner $owner,
    string $name,
    string $category,
    string $adminEmail,
    string $authorEmail,
  ): array {
    $tenant = Tenant::query()->firstOrNew(['name' => $name]);
    $tenant->fill([
      'category' => $category,
      'allow_support' => true,
      'is_due' => false,
    ]);
    $tenant->owner_id = $owner->id;
    $tenant->stripe_customer_id = null;
    $tenant->save();

    $profile = PermissionProfile::query()->firstOrNew([
      'tenant_id' => $tenant->id,
      'name' => 'Editor',
    ]);
    $profile->fill([
      'description' => 'Can review and edit any tenant post.',
      'permissions' => ['posts.view.any', 'posts.update.any'],
    ]);
    $profile->tenant_id = $tenant->id;
    $profile->save();

    $admin = $this->user($adminEmail, "{$name} Admin", UserRole::Admin, $tenant, null);
    $author = $this->user($authorEmail, "{$name} Author", UserRole::Author, $tenant, $profile);

    return [$tenant, $admin, $author];
  }

  private function user(
    string $email,
    string $name,
    UserRole $role,
    ?Tenant $tenant,
    ?PermissionProfile $profile,
  ): User {
    $user = User::query()->firstOrNew(['email' => $email]);
    $user->fill([
      'name' => $name,
      'password' => 'password',
      'role' => $role,
      'permission_profile_id' => $profile?->id,
      'extra_permissions' => [],
    ]);
    $user->tenant_id = $tenant?->id;
    $user->permissions = $role->permissions();
    $user->is_support = false;
    $user->is_tenant_owner = $tenant !== null && $role === UserRole::Admin;
    $user->email_verified_at = now();
    $user->save();

    app(PermissionSyncService::class)->sync($user);

    return $user;
  }

  private function posts(Tenant $tenant, User $admin, User $author): void
  {
    Post::withTrashed()
      ->where('tenant_id', $tenant->id)
      ->forceDelete();

    for ($index = 1; $index <= self::POSTS_PER_TENANT; $index++) {
      $status = match (true) {
        $index <= 40 => PostStatus::Published,
        $index <= 46 => PostStatus::Draft,
        default => PostStatus::Archived,
      };

      $post = new Post([
        'title' => "Demo Post {$tenant->id}-{$index}: ".fake()->sentence(5),
        'body' => $this->body(),
        'status' => $status,
        'published_at' => $status === PostStatus::Published
          ? now()->subDays(60 - $index)->subMinutes($index)
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
    ?Carbon $trialEndsAt,
  ): void {
    Subscription::query()->updateOrCreate(
      ['tenant_id' => $tenant->id],
      [
        'plan_id' => $plan->id,
        'stripe_customer_id' => null,
        'stripe_subscription_id' => null,
        'status' => $status,
        'current_period_start' => now()->startOfMonth(),
        'current_period_end' => now()->addMonth()->startOfMonth(),
        'trial_ends_at' => $trialEndsAt,
        'cancel_at_period_end' => false,
      ],
    );

    $tenant->forceFill(['is_due' => false])->saveQuietly();

    for ($month = 0; $month < self::BILLING_MONTHS; $month++) {
      $date = now()
        ->startOfMonth()
        ->subMonths(self::BILLING_MONTHS - 1 - $month)
        ->addDays(5 + (($month * 3) % 12))
        ->setTime(10, 0);

      $invoiceId = "in_demo_{$tenant->id}_{$date->format('Y_m')}";
      $chargeId = "ch_demo_{$tenant->id}_{$date->format('Y_m')}";

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
          'stripe_customer_id' => null,
          'stripe_subscription_id' => null,
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
          'paid_at' => $date,
        ],
      );
    }
  }
}
