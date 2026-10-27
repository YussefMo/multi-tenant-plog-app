<?php

return [
  'plan_1' => [
    'name' => 'Plan 1',
    'product_id' => env('STRIPE_PLAN_1_PRODUCT_ID'),
    'price_id' => env('STRIPE_PLAN_1_PRICE_ID'),
  ],

  'plan_2' => [
    'name' => 'Plan 2',
    'product_id' => env('STRIPE_PLAN_2_PRODUCT_ID'),
    'price_id' => env('STRIPE_PLAN_2_PRICE_ID'),
  ],
];
