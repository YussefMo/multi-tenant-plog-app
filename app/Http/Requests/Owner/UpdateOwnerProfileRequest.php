<?php

namespace App\Http\Requests\Owner;

use App\Models\Owner;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOwnerProfileRequest extends FormRequest
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
    $owner = $this->user('owner');
    $ownerId = $owner instanceof Owner ? $owner->id : null;

    return [
      'name' => ['sometimes', 'required', 'string', 'max:255'],
      'email' => [
        'sometimes',
        'required',
        'email',
        'max:255',
        Rule::unique('owner.owners', 'email')->ignore($ownerId),
      ],
    ];
  }
}
