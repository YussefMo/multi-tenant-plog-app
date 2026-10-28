<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantInvitationTest extends TestCase
{
  use RefreshDatabase;

  private Owner $owner;

  protected function setUp(): void
  {
    parent::setUp();

    $this->refreshOwnerDatabase();
    $this->owner = Owner::factory()->create();
  }

  public function test_owner_provisions_admin_and_invitation(): void
  {
    $result = $this->createTenant();

    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

    $this->assertSame($result['tenant']['id'], $admin->tenant_id);
    $this->assertSame('admin', $admin->role->value);
    $this->assertNull($admin->password);
    $this->assertTrue($admin->hasPermission('anything'));
    $this->assertDatabaseHas('tenant_invitations', [
      'email' => 'admin@example.com',
      'accepted_at' => null,
    ]);
  }

  public function test_admin_can_accept_invitation_and_login(): void
  {
    $result = $this->createTenant();

    $this->postJson('/api/v1/auth/accept-invitation', [
      'email' => 'admin@example.com',
      'token' => $result['token'],
      'password' => 'password123',
      'password_confirmation' => 'password123',
    ])->assertOk();

    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $this->assertNotNull($admin->password);
    $this->assertNotNull(TenantInvitation::query()->where('email', 'admin@example.com')->firstOrFail()->accepted_at);

    $this->postJson('/api/v1/auth/login', [
      'email' => 'admin@example.com',
      'password' => 'password123',
    ])->assertOk();
  }

  public function test_expired_invitation_is_rejected(): void
  {
    $result = $this->createTenant();

    TenantInvitation::query()
      ->where('email', 'admin@example.com')
      ->update(['expires_at' => now()->subDay()]);

    $this->postJson('/api/v1/auth/accept-invitation', [
      'email' => 'admin@example.com',
      'token' => $result['token'],
      'password' => 'password123',
      'password_confirmation' => 'password123',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('token');
  }

  public function test_used_invitation_cannot_be_reused(): void
  {
    $result = $this->createTenant();

    $payload = [
      'email' => 'admin@example.com',
      'token' => $result['token'],
      'password' => 'password123',
      'password_confirmation' => 'password123',
    ];

    $this->postJson('/api/v1/auth/accept-invitation', $payload)->assertOk();
    $this->postJson('/api/v1/auth/accept-invitation', $payload)
      ->assertStatus(422)
      ->assertJsonValidationErrors('token');
  }

  public function test_duplicate_admin_email_is_rejected(): void
  {
    $tenant = Tenant::factory()->create();
    User::factory()->forTenant($tenant)->create(['email' => 'admin@example.com']);

    $this->actingAs($this->owner, 'owner')
      ->postJson('/api/v1/owner/tenants', [
        'name' => 'Acme',
        'admin_name' => 'Admin',
        'admin_email' => 'admin@example.com',
      ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('admin_email');
  }

  public function test_invalid_invitation_token_is_rejected(): void
  {
    $this->createTenant();

    $this->postJson('/api/v1/auth/accept-invitation', [
      'email' => 'admin@example.com',
      'token' => 'invalid-token',
      'password' => 'password123',
      'password_confirmation' => 'password123',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('token');
  }

  /**
   * @return array{tenant: array<string, mixed>, admin: array<string, mixed>, token: string}
   */
  private function createTenant(): array
  {
    $response = $this->actingAs($this->owner, 'owner')
      ->postJson('/api/v1/owner/tenants', [
        'name' => 'Acme',
        'admin_name' => 'Admin',
        'admin_email' => 'admin@example.com',
      ])
      ->assertCreated();

    return [
      'tenant' => $response->json('data'),
      'admin' => $response->json('admin'),
      'token' => $response->json('invitation.token'),
    ];
  }
}
