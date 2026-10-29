<?php

namespace App\Services;

use App\Models\StripeWebhookEvent;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class StripeWebhookService
{
  public function __construct(
    private readonly StripeGateway $stripe,
    private readonly SubscriptionSyncService $subscriptions,
    private readonly BillingMirrorService $mirror,
  ) {
  }

  /**
   * @param  array<string, mixed>  $event
   * @return array{duplicate: bool, processed: bool}
   */
  public function handle(array $event): array
  {
    $eventId = (string) data_get($event, 'id', '');
    abort_if($eventId === '', 400, 'Stripe event is missing an id.');

    $record = StripeWebhookEvent::query()->firstOrCreate(
      ['stripe_event_id' => $eventId],
      [
        'type' => (string) data_get($event, 'type', 'unknown'),
        'payload' => $event,
      ],
    );

    if ($record->processed_at !== null) {
      return ['duplicate' => true, 'processed' => false];
    }

    DB::transaction(function () use ($event, $record): void {
      $this->process($event);
      $record->forceFill(['processed_at' => now()])->save();
    });

    return ['duplicate' => false, 'processed' => true];
  }

  /**
   * @param  array<string, mixed>  $event
   */
  private function process(array $event): void
  {
    $type = (string) data_get($event, 'type', '');
    $object = data_get($event, 'data.object', []);

    if (! is_array($object)) {
      return;
    }

    switch ($type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        $this->syncCheckoutSession($object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        $this->subscriptions->sync($object);
        break;
      case 'invoice.created':
      case 'invoice.finalized':
      case 'invoice.voided':
        $this->mirror->upsertInvoice($object);
        break;
      case 'invoice.paid':
        $this->mirror->upsertInvoice($object);
        $this->setTenantDue($object, false);
        break;
      case 'invoice.payment_failed':
        $this->handleInvoicePaymentFailed($object);
        break;
      case 'charge.succeeded':
        $this->mirror->upsertPayment($object, 'succeeded');
        break;
      case 'charge.failed':
        $this->mirror->upsertPayment($object, 'failed');
        break;
      case 'charge.refunded':
        $this->mirror->upsertPayment($object);
        break;
      case 'charge.dispute.created':
        $this->markDisputed($object);
        break;
    }
  }

  /**
   * @param  array<string, mixed>  $session
   */
  private function syncCheckoutSession(array $session): void
  {
    $subscription = data_get($session, 'subscription');

    if (is_array($subscription)) {
      $this->subscriptions->sync($subscription);

      return;
    }

    if (is_string($subscription) && $subscription !== '') {
      $this->subscriptions->sync($this->stripe->retrieveSubscription($subscription));
    }
  }

  /**
   * @param  array<string, mixed>  $invoice
   */
  private function handleInvoicePaymentFailed(array $invoice): void
  {
    $subscription = data_get($invoice, 'subscription');

    if (is_string($subscription) && $subscription !== '') {
      $this->subscriptions->sync($this->stripe->retrieveSubscription($subscription));
    }

    $this->mirror->upsertInvoice($invoice);
    $this->setTenantDue($invoice, true);
  }

  /**
   * @param  array<string, mixed>  $object
   */
  private function setTenantDue(array $object, bool $isDue): void
  {
    $tenant = $this->mirror->tenantFor($object);

    if ($tenant instanceof Tenant) {
      $tenant->forceFill(['is_due' => $isDue])->saveQuietly();
    }
  }

  /**
   * @param  array<string, mixed>  $dispute
   */
  private function markDisputed(array $dispute): void
  {
    $chargeId = data_get($dispute, 'charge');

    if (is_string($chargeId) && $chargeId !== '') {
      $this->mirror->markDisputed($chargeId);
    }
  }
}
