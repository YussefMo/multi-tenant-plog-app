<?php

namespace App\Models;

use Database\Factories\StripeWebhookEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $stripe_event_id
 * @property string $type
 * @property array<string, mixed> $payload
 * @property \Illuminate\Support\Carbon|null $processed_at
 */
#[Fillable(['stripe_event_id', 'type', 'payload', 'processed_at'])]
class StripeWebhookEvent extends Model
{
  /** @use HasFactory<StripeWebhookEventFactory> */
  use HasFactory;

  protected function casts(): array
  {
    return [
      'payload' => 'array',
      'processed_at' => 'datetime',
    ];
  }
}
