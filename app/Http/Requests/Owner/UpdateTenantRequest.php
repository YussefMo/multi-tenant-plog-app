<?php

namespace App\Http\Requests\Owner;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantRequest extends FormRequest
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
    ];
  }
}
