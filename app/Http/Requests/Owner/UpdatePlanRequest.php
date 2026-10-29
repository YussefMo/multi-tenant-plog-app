<?php

namespace App\Http\Requests\Owner;

use App\Models\Plan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlanRequest extends FormRequest
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
    $plan = $this->route('plan');
    $planId = $plan instanceof Plan ? $plan->id : null;

    return [
      'name' => ['sometimes', 'required', 'string', 'max:255'],
      'slug' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('plans', 'slug')->ignore($planId)],
      'stripe_product_id' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('plans', 'stripe_product_id')->ignore($planId)],
      'stripe_price_id' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('plans', 'stripe_price_id')->ignore($planId)],
      'amount' => ['sometimes', 'required', 'integer', 'min:0'],
      'currency' => ['sometimes', 'required', 'string', 'size:3'],
      'interval' => ['sometimes', 'required', 'string', 'in:month,year'],
      'features' => ['sometimes', 'array'],
      'features.*' => ['string'],
      'limits' => ['sometimes', 'array'],
      'limits.*' => ['integer', 'min:-1'],
      'is_active' => ['sometimes', 'boolean'],
    ];
  }
}
