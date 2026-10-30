<?php

namespace App\Services;

use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Support\Str;

class TenantInvitationService
{
  /**
   * @return array{invitation: TenantInvitation, token: string}
   */
  public function create(User $user): array
  {
    abort_unless($user->tenant_id !== null, 422, 'Only tenant users can be invited.');

    TenantInvitation::query()
      ->where('tenant_id', $user->tenant_id)
      ->where('email', $user->email)
      ->whereNull('accepted_at')
      ->delete();

    $token = Str::random(64);
    $invitation = new TenantInvitation([
      'email' => $user->email,
      'role' => $user->role,
      'permissions' => $user->permissions ?? [],
      'token_hash' => hash('sha256', $token),
      'expires_at' => now()->addDays(7),
    ]);
    $invitation->tenant_id = $user->tenant_id;
    $invitation->save();

    return ['invitation' => $invitation, 'token' => $token];
  }
}
