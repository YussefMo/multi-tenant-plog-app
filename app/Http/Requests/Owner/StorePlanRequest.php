<?php

namespace App\Http\Requests\Owner;

use Illuminate\Foundation\Http\FormRequest;

class StorePlanRequest extends FormRequest
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
    return [
      'name' => ['required', 'string', 'max:255'],
      'slug' => ['nullable', 'string', 'max:255', 'unique:plans,slug'],
      'stripe_product_id' => ['nullable', 'string', 'max:255', 'unique:plans,stripe_product_id'],
      'stripe_price_id' => ['nullable', 'string', 'max:255', 'unique:plans,stripe_price_id'],
      'amount' => ['required', 'integer', 'min:0'],
      'currency' => ['required', 'string', 'size:3'],
      'interval' => ['required', 'string', 'in:month,year'],
      'features' => ['sometimes', 'array'],
      'features.*' => ['string'],
      'limits' => ['sometimes', 'array'],
      'limits.*' => ['integer', 'min:-1'],
      'is_active' => ['sometimes', 'boolean'],
    ];
  }
}
