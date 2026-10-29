<?php

namespace App\Services;

use RuntimeException;
use Stripe\StripeClient;

class StripeGateway
{
  /**
   * @param  array<string, string>  $metadata
   */
  public function createCustomer(string $name, array $metadata = []): string
  {
    $customer = $this->client()->customers->create([
      'name' => $name,
      'metadata' => $metadata,
    ]);

    return (string) $customer->id;
  }

  /**
   * @param  array<string, mixed>  $params
   * @return array{id: string, url: string}
   */
  public function createCheckoutSession(array $params): array
  {
    $session = $this->client()->checkout->sessions->create($params);
    $url = (string) $session->url;

    if ($url === '') {
      throw new RuntimeException('Stripe Checkout did not return a URL.');
    }

    return [
      'id' => (string) $session->id,
      'url' => $url,
    ];
  }

  public function createPortalSession(string $customerId, string $returnUrl): string
  {
    $session = $this->client()->billingPortal->sessions->create([
      'customer' => $customerId,
      'return_url' => $returnUrl,
    ]);
    $url = (string) $session->url;

    if ($url === '') {
      throw new RuntimeException('Stripe Customer Portal did not return a URL.');
    }

    return $url;
  }

  /**
   * @return array<string, mixed>
   */
  public function retrieveSubscription(string $subscriptionId): array
  {
    return $this->client()->subscriptions->retrieve($subscriptionId)->toArray();
  }

  /**
   * @return array<string, mixed>
   */
  public function cancelSubscriptionAtPeriodEnd(string $subscriptionId): array
  {
    return $this->client()->subscriptions->update($subscriptionId, [
      'cancel_at_period_end' => true,
    ])->toArray();
  }

  /**
   * @param  array<string, string>  $metadata
   */
  public function createProduct(string $name, array $metadata = []): string
  {
    $product = $this->client()->products->create([
      'name' => $name,
      'metadata' => $metadata,
    ]);

    return (string) $product->id;
  }

  /**
   * @return array<string, mixed>
   */
  public function createPrice(string $productId, int $amount, string $currency, string $interval): array
  {
    return $this->client()->prices->create([
      'product' => $productId,
      'unit_amount' => $amount,
      'currency' => $currency,
      'recurring' => ['interval' => $interval],
    ])->toArray();
  }

  /**
   * @return array<string, mixed>
   */
  public function retrievePrice(string $priceId): array
  {
    return $this->client()->prices->retrieve($priceId)->toArray();
  }

  /**
   * @return iterable<int, array<string, mixed>>
   */
  public function listSubscriptions(string $customerId, ?int $since = null): iterable
  {
    return $this->paged(
      $this->client()->subscriptions->all($this->pageParams($customerId, $since)),
    );
  }

  /**
   * @return iterable<int, array<string, mixed>>
   */
  public function listInvoices(string $customerId, ?int $since = null): iterable
  {
    return $this->paged(
      $this->client()->invoices->all($this->pageParams($customerId, $since)),
    );
  }

  /**
   * @return iterable<int, array<string, mixed>>
   */
  public function listCharges(string $customerId, ?int $since = null): iterable
  {
    return $this->paged(
      $this->client()->charges->all($this->pageParams($customerId, $since)),
    );
  }

  /**
   * @return array<string, mixed>
   */
  public function retrieveCharge(string $chargeId): array
  {
    return $this->client()->charges->retrieve($chargeId)->toArray();
  }

  public static function assertSafeConfiguration(): void
  {
    $secret = (string) config('services.stripe.secret');
    $isLive = str_starts_with($secret, 'sk_live_') || str_starts_with($secret, 'rk_live_');

    if ($isLive && ! config('services.stripe.allow_live') && app()->environment(['local', 'testing'])) {
      throw new RuntimeException('Live Stripe keys are not allowed in local/testing. Set STRIPE_ALLOW_LIVE=true only if you really mean it.');
    }
  }

  private function client(): StripeClient
  {
    self::assertSafeConfiguration();

    $secret = (string) config('services.stripe.secret');

    if ($secret === '') {
      throw new RuntimeException('Stripe secret key is not configured.');
    }

    return new StripeClient([
      'api_key' => $secret,
      'stripe_version' => (string) config('services.stripe.api_version'),
      'max_network_retries' => 2,
    ]);
  }

  /**
   * @return array<string, mixed>
   */
  private function pageParams(string $customerId, ?int $since): array
  {
    $params = [
      'customer' => $customerId,
      'limit' => 100,
    ];

    if ($since !== null) {
      $params['created'] = ['gte' => $since];
    }

    return $params;
  }

  /**
   * @template T of \Stripe\StripeObject
   * @param  \Stripe\Collection<T>  $collection
   * @return iterable<int, array<string, mixed>>
   */
  private function paged(\Stripe\Collection $collection): iterable
  {
    foreach ($collection->autoPagingIterator() as $item) {
      yield $item->toArray();
    }
  }
}
