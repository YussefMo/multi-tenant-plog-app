<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantSettingsRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => ['sometimes', 'required', 'string', 'max:255'],
      'category' => ['sometimes', 'nullable', 'string', 'max:100'],
      'allow_support' => ['sometimes', 'boolean'],
    ];
  }
}
