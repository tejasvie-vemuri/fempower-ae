export const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

export function eventEmailKey(kind: 'confirmation' | 'reminder', registrationId: string, ticketCode: string, startsAt: string) {
  return kind === 'confirmation'
    ? `event-confirmation-${registrationId}-${ticketCode}`
    : `event-reminder-${registrationId}-${ticketCode}-${new Date(startsAt).getTime()}`;
}

export function isReminderDue(status: string, eventStatus: string, startsAt: string, now = Date.now(), cancellationRequestedAt?: string | null) {
  const starts = Date.parse(startsAt);
  return status === 'confirmed' && eventStatus === 'published' && !cancellationRequestedAt
    && Number.isFinite(starts) && starts > now && starts - now <= REMINDER_LEAD_MS;
}

export function eventEmailData(reg: { ticket_code: string; quantity: number; amount_paid_cents: number; currency: string }, event: { slug: string; title: string; starts_at: string; timezone: string; location: string | null; cover_image_url: string | null }, name?: string | null) {
  return {
    name: name || '', eventTitle: event.title, startsAt: event.starts_at,
    timezone: event.timezone || 'Asia/Dubai', location: event.location,
    ticketCode: reg.ticket_code, quantity: reg.quantity,
    amountPaid: reg.amount_paid_cents / 100, currency: reg.currency,
    coverImageUrl: event.cover_image_url,
    eventUrl: `https://fempowerae.com/events/${encodeURIComponent(event.slug)}`,
  };
}