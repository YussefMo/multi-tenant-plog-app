<?php

return [
  'ticket_ttl_minutes' => (int) env('SUPPORT_TICKET_TTL_MINUTES', 5),
  'session_idle_minutes' => (int) env('SUPPORT_SESSION_IDLE_MINUTES', 5),
];
