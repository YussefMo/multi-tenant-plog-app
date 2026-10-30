<?php

namespace App\Http\Requests\Owner;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOwnerPasswordRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  /**
   * @return array<string, array<int, string>>
   */
  public function rules(): array
  {
    return [
      'current_password' => ['required', 'string'],
      'password' => ['required', 'string', 'min:8', 'confirmed'],
    ];
  }
}
