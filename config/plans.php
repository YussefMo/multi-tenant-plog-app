<?php

return [
  'plan_1' => [
    'name' => env('STRIPE_PLAN_1_NAME', 'Plan 1'),
    'slug' => env('STRIPE_PLAN_1_SLUG', 'plan-1'),
    'product_id' => env('STRIPE_PLAN_1_PRODUCT_ID'),
    'price_id' => env('STRIPE_PLAN_1_PRICE_ID'),
    'amount' => (int) env('STRIPE_PLAN_1_AMOUNT', 5000),
    'currency' => env('STRIPE_PLAN_1_CURRENCY', 'usd'),
    'interval' => env('STRIPE_PLAN_1_INTERVAL', 'month'),
    'features' => ['published_posts', 'basic_support'],
    'limits' => ['max_users' => 5, 'max_posts' => 50],
  ],

  'plan_2' => [
    'name' => env('STRIPE_PLAN_2_NAME', 'Plan 2'),
    'slug' => env('STRIPE_PLAN_2_SLUG', 'plan-2'),
    'product_id' => env('STRIPE_PLAN_2_PRODUCT_ID'),
    'price_id' => env('STRIPE_PLAN_2_PRICE_ID'),
    'amount' => (int) env('STRIPE_PLAN_2_AMOUNT', 20000),
    'currency' => env('STRIPE_PLAN_2_CURRENCY', 'usd'),
    'interval' => env('STRIPE_PLAN_2_INTERVAL', 'month'),
    'features' => ['published_posts', 'advanced_support', 'analytics'],
    'limits' => ['max_users' => 25, 'max_posts' => 500],
  ],
];
