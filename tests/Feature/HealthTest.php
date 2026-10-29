<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
  public function test_health_endpoint_returns_ok(): void
  {
    $this->getJson('/api/v1/health')
      ->assertOk()
      ->assertJson([
        'status' => 'ok',
        'version' => 'v1',
      ]);
  }

  public function test_up_health_route_is_public(): void
  {
    $this->get('/up')->assertOk();
  }

  public function test_api_root_returns_json_index(): void
  {
    $this->get('/')
      ->assertOk()
      ->assertJson([
        'api' => '/api/v1',
        'health' => '/up',
        'docs' => '/docs/api',
      ]);
  }

  public function test_protected_endpoint_requires_authentication(): void
  {
    $this->getJson('/api/v1/user')
      ->assertUnauthorized();
  }

  public function test_unauthenticated_response_is_json_without_accept_header(): void
  {
    $this->get('/api/v1/user')
      ->assertUnauthorized()
      ->assertJson(['message' => 'Unauthenticated.']);
  }
}
