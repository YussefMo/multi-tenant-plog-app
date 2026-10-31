<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Services\FrontendUrlService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\RedirectResponse;

#[Group('Billing redirects', description: 'Stripe return redirects for the tenant billing page.')]
class BillingRedirectController extends Controller
{
  public function __construct(private readonly FrontendUrlService $frontends)
  {
  }

  #[Endpoint(title: 'Checkout success redirect', description: 'Redirect to the tenant billing page after a successful checkout.')]
  public function success(): RedirectResponse
  {
    return redirect()->away($this->billingUrl('success'));
  }

  #[Endpoint(title: 'Checkout cancel redirect', description: 'Redirect to the tenant billing page after a cancelled checkout.')]
  public function cancel(): RedirectResponse
  {
    return redirect()->away($this->billingUrl('cancelled'));
  }

  #[Endpoint(title: 'Portal return redirect', description: 'Redirect to the tenant billing page after the customer portal.')]
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
