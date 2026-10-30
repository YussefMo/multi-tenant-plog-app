<?php

namespace App\Http\Requests\Tenant;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  /**
   * @return array<string, mixed>
   */
  public function rules(): array
  {
    $user = $this->user();
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
    ];
  }
}
