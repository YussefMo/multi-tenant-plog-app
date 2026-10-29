<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Str;

class BillingService
{
  public function __construct(
    private readonly StripeGateway $stripe,
    private readonly SubscriptionSyncService $subscriptions,
  ) {
  }

  /**
   * @return array{id: string, url: string}
   */
  public function checkout(Tenant $tenant, Plan $plan): array
  {
    abort_unless($plan->is_active, 422, 'This plan is not available.');
    abort_if($plan->stripe_price_id === null, 422, 'This plan has no Stripe price configured.');

    $existing = $tenant->subscription()->first();

    if ($existing instanceof Subscription && $existing->stripe_subscription_id !== null && $existing->status !== 'canceled') {
      abort(409, 'This tenant already has a subscription. Use the billing portal to change plans.');
    }

    $customerId = $this->ensureCustomer($tenant);
    $metadata = [
      'tenant_id' => (string) $tenant->id,
      'plan_id' => (string) $plan->id,
    ];

    return $this->stripe->createCheckoutSession([
      'mode' => 'subscription',
      'customer' => $customerId,
      'line_items' => [
        ['price' => $plan->stripe_price_id, 'quantity' => 1],
      ],
      'success_url' => $this->publicUrl((string) config('billing.checkout_success_path')).'?session_id={CHECKOUT_SESSION_ID}',
      'cancel_url' => $this->publicUrl((string) config('billing.checkout_cancel_path')),
      'client_reference_id' => (string) $tenant->id,
      'metadata' => $metadata,
      'subscription_data' => ['metadata' => $metadata],
      'integration_identifier' => 'checkout_'.Str::lower(Str::random(8)),
    ]);
  }

  public function portal(Tenant $tenant): string
  {
    $customerId = $this->ensureCustomer($tenant);

    return $this->stripe->createPortalSession(
      $customerId,
      $this->publicUrl((string) config('billing.portal_return_path')),
    );
  }

  public function cancel(Tenant $tenant): Subscription
  {
    $subscription = $tenant->subscription()->first();
    abort_unless($subscription instanceof Subscription && $subscription->stripe_subscription_id !== null, 422, 'This tenant has no Stripe subscription.');
    abort_if($subscription->status === 'canceled', 422, 'This subscription is already canceled.');

    $updated = $this->stripe->cancelSubscriptionAtPeriodEnd($subscription->stripe_subscription_id);
    $synced = $this->subscriptions->sync($updated);

    return $synced ?? $subscription;
  }

  public function ensureCustomer(Tenant $tenant): string
  {
    if ($tenant->stripe_customer_id !== null) {
      return $tenant->stripe_customer_id;
    }

    $existingSubscription = $tenant->subscription()->first();
    $existing = $existingSubscription instanceof Subscription
      ? $existingSubscription->stripe_customer_id
      : null;

    if ($existing !== null) {
      $tenant->forceFill(['stripe_customer_id' => $existing])->saveQuietly();

      return $existing;
    }

    $customerId = $this->stripe->createCustomer($tenant->name, [
      'tenant_id' => (string) $tenant->id,
    ]);

    $tenant->forceFill(['stripe_customer_id' => $customerId])->saveQuietly();

    return $customerId;
  }

  public function publicUrl(string $path): string
  {
    return rtrim((string) config('billing.public_url'), '/').'/'.ltrim($path, '/');
  }
}
