<?php

namespace App\Http\Requests\Tenant;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    $tenantId = $this->user()?->tenant_id;
    $user = $this->route('user');
    $userId = $user instanceof User ? $user->id : null;

    return [
      'name' => ['sometimes', 'required', 'string', 'max:255'],
      'email' => [
        'sometimes',
        'required',
        'email',
        'max:255',
        Rule::unique('users', 'email')->ignore($userId),
      ],
      'password' => ['sometimes', 'nullable', 'string', 'min:8'],
      'role' => ['sometimes', Rule::enum(UserRole::class)],
      'permission_profile_id' => [
        'sometimes',
        'nullable',
        'integer',
        Rule::exists('permission_profiles', 'id')->where('tenant_id', $tenantId),
      ],
      'extra_permissions' => ['sometimes', 'array'],
      'extra_permissions.*' => ['string', Rule::in((array) config('permissions.catalog'))],
    ];
  }
}
