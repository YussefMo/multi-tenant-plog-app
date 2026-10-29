<?php

namespace App\Models;

use Database\Factories\BillingPaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string|null $stripe_charge_id
 * @property string|null $stripe_payment_intent_id
 * @property string|null $stripe_invoice_id
 * @property int $amount
 * @property int $amount_refunded
 * @property string $currency
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property \App\Models\Tenant $tenant
 */
#[Fillable([
  'tenant_id',
  'stripe_charge_id',
  'stripe_payment_intent_id',
  'stripe_invoice_id',
  'amount',
  'amount_refunded',
  'currency',
  'status',
  'paid_at',
])]
class BillingPayment extends Model
{
  /** @use HasFactory<BillingPaymentFactory> */
  use HasFactory;

  protected function casts(): array
  {
    return [
      'amount' => 'integer',
      'amount_refunded' => 'integer',
      'paid_at' => 'datetime',
    ];
  }

  public function tenant(): BelongsTo
  {
    return $this->belongsTo(Tenant::class);
  }
}
