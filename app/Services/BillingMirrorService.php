<?php

namespace App\Services;

use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Carbon;

class BillingMirrorService
{
  public function __construct(private readonly StripeGateway $stripe)
  {
  }

  /**
   * @param  array<string, mixed>  $invoice
   */
  public function upsertInvoice(array $invoice, ?string $status = null): ?BillingInvoice
  {
    $stripeInvoiceId = $this->stringValue(data_get($invoice, 'id'));

    if ($stripeInvoiceId === null) {
      return null;
    }

    $tenant = $this->tenantFor($invoice);

    if (! $tenant instanceof Tenant) {
      return null;
    }

    return BillingInvoice::query()->updateOrCreate(
      ['stripe_invoice_id' => $stripeInvoiceId],
      [
        'tenant_id' => $tenant->id,
        'stripe_customer_id' => $this->stringValue(data_get($invoice, 'customer')),
        'stripe_subscription_id' => $this->stringValue(data_get($invoice, 'subscription')),
        'status' => $status ?? (string) data_get($invoice, 'status', 'open'),
        'currency' => (string) data_get($invoice, 'currency', config('billing.default_currency', 'usd')),
        'subtotal' => (int) data_get($invoice, 'subtotal', 0),
        'tax' => (int) data_get($invoice, 'tax', 0),
        'total' => (int) data_get($invoice, 'total', 0),
        'amount_paid' => (int) data_get($invoice, 'amount_paid', 0),
        'amount_due' => (int) data_get($invoice, 'amount_due', 0),
        'hosted_invoice_url' => $this->stringValue(data_get($invoice, 'hosted_invoice_url')),
        'invoice_pdf' => $this->stringValue(data_get($invoice, 'invoice_pdf')),
        'period_start' => $this->timestamp(data_get($invoice, 'period_start')),
        'period_end' => $this->timestamp(data_get($invoice, 'period_end')),
        'paid_at' => $this->timestamp(data_get($invoice, 'status_transitions.paid_at')),
      ],
    );
  }

  /**
   * @param  array<string, mixed>  $charge
   */
  public function upsertPayment(array $charge, ?string $status = null): ?BillingPayment
  {
    $chargeId = $this->stringValue(data_get($charge, 'id'));
    $paymentIntentId = $this->stringValue(data_get($charge, 'payment_intent'));

    if ($chargeId === null && $paymentIntentId === null) {
      return null;
    }

    $tenant = $this->tenantFor($charge);

    if (! $tenant instanceof Tenant) {
      return null;
    }

    $keys = $chargeId !== null
      ? ['stripe_charge_id' => $chargeId]
      : ['stripe_payment_intent_id' => $paymentIntentId];

    $amount = (int) data_get($charge, 'amount', 0);
    $amountRefunded = (int) data_get($charge, 'amount_refunded', 0);

    return BillingPayment::query()->updateOrCreate(
      $keys,
      [
        'tenant_id' => $tenant->id,
        'stripe_charge_id' => $chargeId,
        'stripe_payment_intent_id' => $paymentIntentId,
        'stripe_invoice_id' => $this->stringValue(data_get($charge, 'invoice')),
        'amount' => $amount,
        'amount_refunded' => $amountRefunded,
        'currency' => (string) data_get($charge, 'currency', config('billing.default_currency', 'usd')),
        'status' => $status ?? $this->paymentStatus($charge, $amount, $amountRefunded),
        'paid_at' => $this->timestamp(data_get($charge, 'created')),
      ],
    );
  }

  public function markDisputed(string $chargeId): ?BillingPayment
  {
    $payment = BillingPayment::query()
      ->where('stripe_charge_id', $chargeId)
      ->first();

    if ($payment instanceof BillingPayment) {
      $payment->update(['status' => 'disputed']);

      return $payment;
    }

    return $this->upsertPayment($this->stripe->retrieveCharge($chargeId), 'disputed');
  }

  /**
   * @param  array<string, mixed>  $object
   */
  public function tenantFor(array $object): ?Tenant
  {
    $subscriptionId = $this->stringValue(data_get($object, 'subscription'));

    if ($subscriptionId !== null) {
      $tenant = Subscription::query()
        ->where('stripe_subscription_id', $subscriptionId)
        ->first()
        ?->tenant;

      if ($tenant instanceof Tenant) {
        return $tenant;
      }
    }

    $customerId = $this->stringValue(data_get($object, 'customer'));

    if ($customerId === null) {
      return null;
    }

    $tenant = Tenant::query()
      ->where('stripe_customer_id', $customerId)
      ->first();

    if ($tenant instanceof Tenant) {
      return $tenant;
    }

    return Subscription::query()
      ->where('stripe_customer_id', $customerId)
      ->first()
      ?->tenant;
  }

  /**
   * @param  array<string, mixed>  $charge
   */
  private function paymentStatus(array $charge, int $amount, int $amountRefunded): string
  {
    if (data_get($charge, 'status') === 'failed') {
      return 'failed';
    }

    if ($amount > 0 && $amountRefunded >= $amount) {
      return 'refunded';
    }

    if ($amountRefunded > 0) {
      return 'partially_refunded';
    }

    return (string) data_get($charge, 'status', 'succeeded');
  }

  private function timestamp(mixed $value): ?Carbon
  {
    if ($value === null || $value === '') {
      return null;
    }

    return Carbon::createFromTimestamp((int) $value);
  }

  private function stringValue(mixed $value): ?string
  {
    if (! is_scalar($value)) {
      return null;
    }

    $value = (string) $value;

    return $value === '' ? null : $value;
  }
}
