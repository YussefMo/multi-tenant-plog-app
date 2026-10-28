<?php

$origins = array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')));
$patterns = array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGIN_PATTERNS', '')));

return [
  'paths' => ['api/*'],
  'allowed_methods' => ['*'],
  'allowed_origins' => array_values(array_filter($origins)),
  'allowed_origins_patterns' => array_values(array_filter($patterns)),
  'allowed_headers' => ['*'],
  'exposed_headers' => [],
  'max_age' => 0,
  'supports_credentials' => true,
];
