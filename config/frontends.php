<?php

return [
  'owner' => env('OWNER_FRONTEND_URL', 'http://owner.multi-tenant-plog.test'),
  'tenant' => env('TENANT_FRONTEND_URL', 'http://{slug}.tenant.multi-tenant-plog.test'),
  'user' => env('USER_FRONTEND_URL', 'http://{slug}.user.multi-tenant-plog.test'),
  'support_path' => env('TENANT_SUPPORT_PATH', '/support/accept'),
  'accept_invitation_path' => env('TENANT_ACCEPT_INVITATION_PATH', '/accept-invitation'),
];
