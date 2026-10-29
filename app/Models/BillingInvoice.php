<?php

namespace App\Models;

use Database\Factories\BillingInvoiceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $stripe_invoice_id
 * @property string|null $stripe_customer_id
 * @property string|null $stripe_subscription_id
 * @property string $status
 * @property string $currency
 * @property int $subtotal
 * @property int $tax
 * @property int $total
 * @property int $amount_paid
 * @property int $amount_due
 * @property string|null $hosted_invoice_url
 * @property string|null $invoice_pdf
 * @property \Illuminate\Support\Carbon|null $period_start
 * @property \Illuminate\Support\Carbon|null $period_end
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property \App\Models\Tenant $tenant
 */
#[Fillable([
  'tenant_id',
  'stripe_invoice_id',
  'stripe_customer_id',
  'stripe_subscription_id',
  'status',
  'currency',
  'subtotal',
  'tax',
  'total',
  'amount_paid',
  'amount_due',
  'hosted_invoice_url',
  'invoice_pdf',
  'period_start',
  'period_end',
  'paid_at',
])]
class BillingInvoice extends Model
{
  /** @use HasFactory<BillingInvoiceFactory> */
  use HasFactory;

  protected function casts(): array
  {
    return [
      'subtotal' => 'integer',
      'tax' => 'integer',
      'total' => 'integer',
      'amount_paid' => 'integer',
      'amount_due' => 'integer',
      'period_start' => 'datetime',
      'period_end' => 'datetime',
      'paid_at' => 'datetime',
    ];
  }

  public function tenant(): BelongsTo
  {
    return $this->belongsTo(Tenant::class);
  }
}
