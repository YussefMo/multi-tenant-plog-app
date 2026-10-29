<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Services\FrontendUrlService;
use Illuminate\Http\RedirectResponse;

class BillingRedirectController extends Controller
{
  public function __construct(private readonly FrontendUrlService $frontends)
  {
  }

  public function success(): RedirectResponse
  {
    return redirect()->away($this->billingUrl('success'));
  }

  public function cancel(): RedirectResponse
  {
    return redirect()->away($this->billingUrl('cancelled'));
  }

  public function portalReturn(): RedirectResponse
  {
    return redirect()->away($this->billingUrl('portal'));
  }

  private function billingUrl(string $status): string
  {
    $path = (string) config('frontends.billing_path', '/billing');

    return $this->frontends->tenant($path.'?status='.$status);
  }
}
