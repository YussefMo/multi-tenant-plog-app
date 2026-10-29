<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StripeWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeWebhookController extends Controller
{
  public function __invoke(Request $request, StripeWebhookService $webhooks): JsonResponse
  {
    $payload = $request->getContent();
    $signature = (string) $request->header('Stripe-Signature');

    try {
      $event = Webhook::constructEvent(
        $payload,
        $signature,
        (string) config('services.stripe.webhook_secret'),
      );
    } catch (UnexpectedValueException|SignatureVerificationException) {
      abort(400, 'Invalid Stripe webhook signature.');
    }

    $result = $webhooks->handle($event->toArray());

    return response()->json([
      'received' => true,
      ...$result,
    ]);
  }
}
