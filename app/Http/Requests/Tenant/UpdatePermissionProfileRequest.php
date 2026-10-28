<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionProfileRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => ['sometimes', 'required', 'string', 'max:255'],
      'description' => ['sometimes', 'nullable', 'string', 'max:255'],
      'permissions' => ['sometimes', 'array'],
      'permissions.*' => ['string', Rule::in((array) config('permissions.catalog'))],
    ];
  }
}
