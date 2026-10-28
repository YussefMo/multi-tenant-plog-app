<?php

namespace App\Http\Requests\Owner;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => ['required', 'string', 'max:255'],
      'category' => ['nullable', 'string', 'max:100'],
      'admin_name' => ['required', 'string', 'max:255'],
      'admin_email' => ['required', 'email', 'max:255', 'unique:users,email'],
    ];
  }
}
