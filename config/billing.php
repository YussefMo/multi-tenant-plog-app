<?php

return [
  'public_url' => rtrim((string) env('PUBLIC_API_URL', env('APP_URL', 'http://localhost')), '/'),

  'webhook_path' => '/api/v1/stripe/webhook',

  'checkout_success_path' => '/api/v1/billing/checkout/success',

  'checkout_cancel_path' => '/api/v1/billing/checkout/cancel',

  'portal_return_path' => '/api/v1/billing/portal/return',

  'default_currency' => env('BILLING_CURRENCY', 'usd'),
];
