<?php

namespace App\Notifications;

use App\Models\TenantInvitation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TenantInvitationNotification extends Notification
{
  public function __construct(
    public TenantInvitation $invitation,
    public string $token,
  ) {
  }

  public function via(object $notifiable): array
  {
    return ['mail'];
  }

  public function toMail(object $notifiable): MailMessage
  {
    $url = rtrim((string) config('app.url'), '/').'/accept-invitation?'.http_build_query([
      'email' => $this->invitation->email,
      'token' => $this->token,
    ]);

    return (new MailMessage())
      ->subject('You are invited to '.$this->invitation->tenant->name)
      ->line('Use the link below to accept the invitation and set your password.')
      ->action('Accept invitation', $url)
      ->line('This invitation expires on '.$this->invitation->expires_at?->toDayDateTimeString().'.');
  }
}
