<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'title' => ['sometimes', 'required', 'string', 'max:255'],
      'body' => ['sometimes', 'required', 'string'],
    ];
  }
}
