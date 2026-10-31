<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Resources\BillingPaymentResource;
use App\Models\BillingPayment;
use App\Services\BillingMetricsService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Billing', description: 'Owner billing metrics and cross-tenant transactions.')]
class BillingController extends Controller
{
  #[Endpoint(title: 'Billing metrics', description: 'Return MRR, ARR, revenue, refunds, disputes, churn, and the monthly timeline.')]
  public function metrics(Request $request, BillingMetricsService $metrics): JsonResponse
  {
    $from = $request->date('from') ?? now()->startOfMonth()->subMonths(11);
    $to = $request->date('to') ?? now();

    return response()->json([
      'data' => $metrics->summary($from, $to),
    ]);
  }

  #[Endpoint(title: 'Billing transactions', description: 'List cross-tenant payments with tenant, status, date, and pagination filters.')]
  public function transactions(Request $request): AnonymousResourceCollection
  {
    $from = $request->date('from');
    $to = $request->date('to');

    $transactions = BillingPayment::query()
      ->with('tenant')
      ->when($request->filled('tenant_id'), fn ($query) => $query->where('tenant_id', $request->integer('tenant_id')))
      ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
      ->when($from !== null, fn ($query) => $query->where('paid_at', '>=', $from))
      ->when($to !== null, fn ($query) => $query->where('paid_at', '<=', $to))
      ->latest('paid_at')
      ->paginate(min(max((int) $request->query('per_page', 20), 1), 100))
      ->withQueryString();

    return BillingPaymentResource::collection($transactions);
  }
}
