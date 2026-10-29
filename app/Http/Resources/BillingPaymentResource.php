<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read int $tenant_id
 * @property-read string|null $stripe_charge_id
 * @property-read string|null $stripe_payment_intent_id
 * @property-read string|null $stripe_invoice_id
 * @property-read int $amount
 * @property-read int $amount_refunded
 * @property-read string $currency
 * @property-read string $status
 * @property-read \Illuminate\Support\Carbon|null $paid_at
 * @property-read \App\Models\Tenant|null $tenant
 * @property-read \Illuminate\Support\Carbon|null $created_at
 */
class BillingPaymentResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'type' => 'payment',
      'tenant_id' => $this->tenant_id,
      'stripe_charge_id' => $this->stripe_charge_id,
      'stripe_payment_intent_id' => $this->stripe_payment_intent_id,
      'stripe_invoice_id' => $this->stripe_invoice_id,
      'amount' => $this->amount,
      'amount_refunded' => $this->amount_refunded,
      'currency' => $this->currency,
      'status' => $this->status,
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
