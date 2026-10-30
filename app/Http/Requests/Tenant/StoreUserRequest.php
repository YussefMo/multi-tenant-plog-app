<?php

namespace App\Http\Requests\Tenant;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    $tenantId = $this->user()?->tenant_id;

    return [
      'name' => ['required', 'string', 'max:255'],
      'email' => ['required', 'email', 'max:255', 'unique:users,email'],
      'invite' => ['sometimes', 'boolean'],
      'password' => [
        'nullable',
        'string',
        'min:8',
        'confirmed',
        Rule::requiredIf(fn (): bool => ! $this->boolean('invite')),
      ],
      'password_confirmation' => ['nullable', 'string', 'min:8'],
      'role' => ['required', Rule::in([UserRole::Admin->value, UserRole::Author->value])],
      'permission_profile_id' => [
        'nullable',
        'integer',
        Rule::exists('permission_profiles', 'id')->where('tenant_id', $tenantId),
      ],
      'extra_permissions' => ['sometimes', 'array'],
      'extra_permissions.*' => ['string', Rule::in((array) config('permissions.catalog'))],
    ];
  }
}
