<?php

namespace Database\Factories;

use App\Models\StripeWebhookEvent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<StripeWebhookEvent> */
class StripeWebhookEventFactory extends Factory
{
  protected $model = StripeWebhookEvent::class;

  public function definition(): array
  {
    return [
      'stripe_event_id' => 'evt_'.Str::random(14),
      'type' => 'customer.subscription.updated',
      'payload' => [],
      'processed_at' => null,
    ];
  }
}
