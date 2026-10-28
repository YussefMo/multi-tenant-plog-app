<?php

namespace App\Services;

class FrontendUrlService
{
  public function owner(string $path = '/'): string
  {
    return $this->build((string) config('frontends.owner'), $path);
  }

  public function tenant(string $path = '/'): string
  {
    return $this->build((string) config('frontends.tenant'), $path);
  }

  public function user(string $path = '/'): string
  {
    return $this->build((string) config('frontends.user'), $path);
  }

  public function support(string $ticket): string
  {
    $url = $this->tenant((string) config('frontends.support_path', '/support/accept'));

    return $url.'?'.http_build_query(['ticket' => $ticket]);
  }

  private function build(string $template, string $path): string
  {
    $path = '/'.ltrim($path, '/');

    return rtrim($template, '/').$path;
  }
}
