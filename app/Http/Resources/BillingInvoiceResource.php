<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read int $tenant_id
 * @property-read string $stripe_invoice_id
 * @property-read string|null $stripe_customer_id
 * @property-read string|null $stripe_subscription_id
 * @property-read string $status
 * @property-read string $currency
 * @property-read int $subtotal
 * @property-read int $tax
 * @property-read int $total
 * @property-read int $amount_paid
 * @property-read int $amount_due
 * @property-read string|null $hosted_invoice_url
 * @property-read string|null $invoice_pdf
 * @property-read \Illuminate\Support\Carbon|null $period_start
 * @property-read \Illuminate\Support\Carbon|null $period_end
 * @property-read \Illuminate\Support\Carbon|null $paid_at
 * @property-read \App\Models\Tenant|null $tenant
 * @property-read \Illuminate\Support\Carbon|null $created_at
 */
class BillingInvoiceResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'tenant_id' => $this->tenant_id,
      'stripe_invoice_id' => $this->stripe_invoice_id,
      'stripe_customer_id' => $this->stripe_customer_id,
      'stripe_subscription_id' => $this->stripe_subscription_id,
      'status' => $this->status,
      'currency' => $this->currency,
      'subtotal' => $this->subtotal,
      'tax' => $this->tax,
      'total' => $this->total,
      'amount_paid' => $this->amount_paid,
      'amount_due' => $this->amount_due,
      'hosted_invoice_url' => $this->hosted_invoice_url,
      'invoice_pdf' => $this->invoice_pdf,
      'period_start' => $this->period_start?->toIso8601String(),
      'period_end' => $this->period_end?->toIso8601String(),
      'paid_at' => $this->paid_at?->toIso8601String(),
      'tenant' => $this->whenLoaded(
        'tenant',
        fn () => $this->tenant ? [
          'id' => $this->tenant->id,
          'name' => $this->tenant->name,
        ] : null,
      ),
      'created_at' => $this->created_at?->toIso8601String(),
    ];
  }
}
