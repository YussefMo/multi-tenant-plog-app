<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\BillingMirrorService;
use App\Services\StripeGateway;
use App\Services\SubscriptionSyncService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

#[Signature('stripe:sync-billing
  {--tenant= : Tenant ID}
  {--since= : Only include Stripe objects created on or after this date/timestamp}')]
#[Description('Backfill invoices, payments, and subscriptions from Stripe')]
class StripeSyncBillingCommand extends Command
{
  public function handle(
    StripeGateway $stripe,
    SubscriptionSyncService $subscriptions,
    BillingMirrorService $mirror,
  ): int {
    $since = $this->sinceTimestamp();
    $tenants = Tenant::query()
      ->when($this->option('tenant') !== null, fn ($query) => $query->whereKey((int) $this->option('tenant')))
      ->where(function ($query): void {
        $query->whereNotNull('stripe_customer_id')
          ->orWhereHas('subscription', fn ($query) => $query->whereNotNull('stripe_customer_id'));
      })
      ->orderBy('id')
      ->get();

    foreach ($tenants as $tenant) {
      $customerId = $tenant->stripe_customer_id
        ?? $tenant->subscription()->value('stripe_customer_id');

      if (! is_string($customerId) || $customerId === '') {
        continue;
      }

      $subscriptionCount = 0;
      foreach ($stripe->listSubscriptions($customerId, $since) as $subscription) {
        if ($subscriptions->sync($subscription) !== null) {
          $subscriptionCount++;
        }
      }

      $invoiceCount = 0;
      foreach ($stripe->listInvoices($customerId, $since) as $invoice) {
        if ($mirror->upsertInvoice($invoice) !== null) {
          $invoiceCount++;
        }
      }

      $paymentCount = 0;
      foreach ($stripe->listCharges($customerId, $since) as $charge) {
        if ($mirror->upsertPayment($charge) !== null) {
          $paymentCount++;
        }
      }

      $this->info("Tenant {$tenant->id}: {$subscriptionCount} subscription(s), {$invoiceCount} invoice(s), {$paymentCount} payment(s).");
    }

    return self::SUCCESS;
  }

  private function sinceTimestamp(): ?int
  {
    $since = $this->option('since');

    if ($since === null || $since === '') {
      return null;
    }

    return is_numeric($since)
      ? (int) $since
      : Carbon::parse((string) $since)->timestamp;
  }
}
