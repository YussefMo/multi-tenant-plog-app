<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Resources\BillingPaymentResource;
use App\Models\BillingPayment;
use App\Services\BillingMetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BillingController extends Controller
{
  public function metrics(Request $request, BillingMetricsService $metrics): JsonResponse
  {
    $from = $request->date('from') ?? now()->subMonths(11)->startOfMonth();
    $to = $request->date('to') ?? now();

    return response()->json([
      'data' => $metrics->summary($from, $to),
    ]);
  }

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
