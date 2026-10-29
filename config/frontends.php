<?php

return [
  'owner' => env('OWNER_FRONTEND_URL', 'http://localhost:3000'),
  'tenant' => env('TENANT_FRONTEND_URL', 'http://localhost:3001'),
  'user' => env('USER_FRONTEND_URL', 'http://localhost:3002'),
  'support_path' => env('TENANT_SUPPORT_PATH', '/support/accept'),
  'accept_invitation_path' => env('TENANT_ACCEPT_INVITATION_PATH', '/accept-invitation'),
  'billing_path' => env('TENANT_BILLING_PATH', '/billing'),
];
