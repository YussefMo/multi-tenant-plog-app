<?php

namespace Tests\Feature;

use Tests\TestCase;

class SessionRealmTest extends TestCase
{
  public function test_tenant_csrf_endpoint_uses_tenant_session_cookie(): void
  {
    $this->getJson('/api/v1/csrf-token')
      ->assertOk()
      ->assertJsonStructure(['csrf_token'])
      ->assertCookie(config('session.tenant_cookie'))
      ->assertCookieMissing(config('session.owner_cookie'));
  }

  public function test_owner_csrf_endpoint_uses_owner_session_cookie(): void
  {
    $this->getJson('/api/v1/owner/csrf-token')
      ->assertOk()
      ->assertJsonStructure(['csrf_token'])
      ->assertCookie(config('session.owner_cookie'))
      ->assertCookieMissing(config('session.tenant_cookie'));
  }
}
