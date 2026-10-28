<?php

namespace App\Services;

use App\Models\Tenant;

class FrontendUrlService
{
  public function owner(string $path = '/'): string
  {
    return $this->build((string) config('frontends.owner'), null, $path);
  }

  public function tenant(Tenant $tenant, string $path = '/'): string
  {
    return $this->build((string) config('frontends.tenant'), $tenant, $path);
  }

  public function user(Tenant $tenant, string $path = '/'): string
  {
    return $this->build((string) config('frontends.user'), $tenant, $path);
  }

  public function support(Tenant $tenant, string $ticket): string
  {
    $url = $this->tenant($tenant, (string) config('frontends.support_path', '/support/accept'));

    return $url.'?'.http_build_query(['ticket' => $ticket]);
  }

  private function build(string $template, ?Tenant $tenant, string $path): string
  {
    $base = $tenant
      ? str_replace('{slug}', $tenant->slug, $template)
      : $template;

    $path = '/'.ltrim($path, '/');

    return rtrim($base, '/').$path;
  }
}
