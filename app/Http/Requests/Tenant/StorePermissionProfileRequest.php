<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePermissionProfileRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => ['required', 'string', 'max:255'],
      'description' => ['nullable', 'string', 'max:255'],
      'permissions' => ['required', 'array'],
      'permissions.*' => ['string', Rule::in((array) config('permissions.catalog'))],
    ];
  }
}
