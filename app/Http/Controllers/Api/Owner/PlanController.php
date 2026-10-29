<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\StorePlanRequest;
use App\Http\Requests\Owner\UpdatePlanRequest;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class PlanController extends Controller
{
  public function index(): AnonymousResourceCollection
  {
    return PlanResource::collection(
      Plan::query()->orderBy('amount')->get(),
    );
  }

  public function store(StorePlanRequest $request): JsonResponse
  {
    $data = $request->validated();
    $data['slug'] = $this->uniqueSlug($data['slug'] ?? $data['name']);

    $plan = new Plan($data);
    $plan->save();

    return (new PlanResource($plan))->response()->setStatusCode(201);
  }

  public function show(Plan $plan): PlanResource
  {
    return new PlanResource($plan);
  }

  public function update(UpdatePlanRequest $request, Plan $plan): PlanResource
  {
    $data = $request->validated();

    if (array_key_exists('slug', $data) && $data['slug'] !== null) {
      $data['slug'] = $this->uniqueSlug($data['slug'], $plan);
    }

    $plan->fill($data);
    $plan->save();

    return new PlanResource($plan);
  }

  public function destroy(Plan $plan): Response
  {
    abort_if($plan->subscriptions()->exists(), 409, 'This plan has subscriptions and cannot be deleted.');

    $plan->delete();

    return response()->noContent();
  }

  private function uniqueSlug(string $value, ?Plan $ignore = null): string
  {
    $base = Str::limit(Str::slug($value), 200, '') ?: 'plan';
    $slug = $base;
    $suffix = 2;

    while (Plan::query()
      ->where('slug', $slug)
      ->when($ignore !== null, fn ($query) => $query->where('id', '!=', $ignore->id))
      ->exists()) {
      $slug = "{$base}-{$suffix}";
      $suffix++;
    }

    return $slug;
  }
}
