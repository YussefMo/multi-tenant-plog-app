<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\CheckoutRequest;
use App\Http\Resources\BillingInvoiceResource;
use App\Http\Resources\BillingPaymentResource;
use App\Http\Resources\PlanResource;
use App\Http\Resources\SubscriptionResource;
use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\BillingService;
use App\Services\TenantTrialService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Billing', description: 'Tenant billing, checkout, trial, and history.')]
class BillingController extends Controller
{
  #[Endpoint(title: 'List billing plans', description: 'Return active plans available to the tenant.')]
  public function plans(): AnonymousResourceCollection
  {
    return PlanResource::collection(
      Plan::query()
        ->where('is_active', true)
        ->orderBy('amount')
        ->get(),
    );
  }

  #[Endpoint(title: 'Show subscription', description: 'Return the tenant subscription.')]
  public function subscription(Request $request): JsonResponse|SubscriptionResource
  {
    $tenant = $this->tenant($request);
    $subscription = $tenant->subscription()->with('plan')->first();

    if (! $subscription instanceof Subscription) {
      return response()->json(['data' => null]);
    }

    return new SubscriptionResource($subscription);
  }

  #[Endpoint(title: 'Create checkout', description: 'Create a Stripe Checkout session for a plan.')]
  public function checkout(CheckoutRequest $request, BillingService $billing): JsonResponse
  {
    $tenant = $this->tenant($request);
    $plan = Plan::query()->findOrFail($request->integer('plan_id'));
    $session = $billing->checkout($tenant, $plan);

    return response()->json([
      'checkout_url' => $session['url'],
      'session_id' => $session['id'],
    ], 201);
  }

  #[Endpoint(title: 'Start trial', description: 'Start the one-time tenant trial and clear the due flag.')]
  public function trial(Request $request, TenantTrialService $trials): JsonResponse
  {
    $tenant = $this->tenant($request);
    $subscription = $trials->start($tenant);

    return (new SubscriptionResource($subscription->load('plan')))
      ->response()
      ->setStatusCode(201);
  }

  #[Endpoint(title: 'Open customer portal', description: 'Create a Stripe Customer Portal session.')]
  public function portal(Request $request, BillingService $billing): JsonResponse
  {
    $tenant = $this->tenant($request);

    return response()->json([
      'portal_url' => $billing->portal($tenant),
    ]);
  }

  #[Endpoint(title: 'Cancel subscription', description: 'Cancel the subscription at period end.')]
  public function cancel(Request $request, BillingService $billing): SubscriptionResource
  {
    $tenant = $this->tenant($request);
    $subscription = $billing->cancel($tenant);

    return new SubscriptionResource($subscription->load('plan'));
  }

  #[Endpoint(title: 'List invoices', description: 'List tenant invoices with pagination.')]
  public function invoices(Request $request): AnonymousResourceCollection
  {
    $tenant = $this->tenant($request);
    $from = $request->date('from');
    $to = $request->date('to');
    $perPage = min(max((int) $request->query('per_page', 15), 1), 100);

    $invoices = BillingInvoice::query()
      ->where('tenant_id', $tenant->id)
      ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
      ->when($from !== null, fn ($query) => $query->where('created_at', '>=', $from))
      ->when($to !== null, fn ($query) => $query->where('created_at', '<=', $to))
      ->latest()
      ->paginate($perPage)
      ->withQueryString();

    return BillingInvoiceResource::collection($invoices);
  }

  #[Endpoint(title: 'List payments', description: 'List tenant payments with pagination.')]
  public function payments(Request $request): AnonymousResourceCollection
  {
    $tenant = $this->tenant($request);
    $from = $request->date('from');
    $to = $request->date('to');
    $perPage = min(max((int) $request->query('per_page', 15), 1), 100);

    $payments = BillingPayment::query()
      ->where('tenant_id', $tenant->id)
      ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
      ->when($from !== null, fn ($query) => $query->where('paid_at', '>=', $from))
      ->when($to !== null, fn ($query) => $query->where('paid_at', '<=', $to))
      ->latest()
      ->paginate($perPage)
      ->withQueryString();

    return BillingPaymentResource::collection($payments);
  }

  private function tenant(Request $request): Tenant
  {
    $tenant = $request->user()?->tenant;

    abort_unless($tenant instanceof Tenant, 403, 'Billing is only available to tenant accounts.');

    return $tenant;
  }
}
