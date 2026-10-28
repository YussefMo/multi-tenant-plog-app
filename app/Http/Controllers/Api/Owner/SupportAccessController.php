<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Owner;
use App\Models\Tenant;
use App\Models\TenantSupportTicket;
use App\Services\FrontendUrlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupportAccessController extends Controller
{
  public function store(Request $request, Tenant $tenant, FrontendUrlService $frontends): JsonResponse
  {
    $owner = $request->user('owner');
    abort_unless($owner instanceof Owner, 401);
    abort_unless($tenant->owner_id === $owner->id, 404);
    abort_unless($tenant->allow_support && ! $tenant->trashed(), 403, 'Support access is disabled for this tenant.');

    $token = Str::random(64);
    $ticket = new TenantSupportTicket([
      'token_hash' => hash('sha256', $token),
      'expires_at' => now()->addMinutes((int) config('support.ticket_ttl_minutes', 5)),
    ]);
    $ticket->tenant_id = $tenant->id;
    $ticket->owner_id = $owner->id;
    $ticket->save();

    return response()->json([
      'ticket' => $token,
      'expires_at' => $ticket->expires_at?->toIso8601String(),
      'redirect_url' => $frontends->support($token),
    ], 201);
  }
}
