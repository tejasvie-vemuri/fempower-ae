import { describe, expect, it } from 'vitest';
import { eventEmailData, eventEmailKey, isReminderDue } from '../../supabase/functions/_shared/event-email-policy';

describe('attendee email rules', () => {
  const now = Date.parse('2026-11-06T06:00:00Z');
  it('sends the reminder within 24 hours, never before the window', () => {
    expect(isReminderDue('confirmed', 'published', '2026-11-07T06:00:00Z', now)).toBe(true);
    expect(isReminderDue('confirmed', 'published', '2026-11-07T06:00:01Z', now)).toBe(false);
  });
  it('excludes cancelled, pending, draft, past and cancellation-requested bookings', () => {
    for (const status of ['cancelled', 'pending', 'refunded']) expect(isReminderDue(status, 'published', '2026-11-07T06:00:00Z', now)).toBe(false);
    expect(isReminderDue('confirmed', 'draft', '2026-11-07T06:00:00Z', now)).toBe(false);
    expect(isReminderDue('confirmed', 'published', '2026-11-06T06:00:00Z', now)).toBe(false);
    expect(isReminderDue('confirmed', 'published', '2026-11-07T06:00:00Z', now, '2026-11-06T05:00:00Z')).toBe(false);
  });
  it('deduplicates retries and gives transferred tickets and rescheduled reminders fresh keys', () => {
    const key = eventEmailKey('reminder', 'reg', 'ticket', '2026-11-07T06:00:00Z');
    expect(eventEmailKey('reminder', 'reg', 'ticket', '2026-11-07T06:00:00Z')).toBe(key);
    expect(eventEmailKey('reminder', 'reg', 'new-ticket', '2026-11-07T06:00:00Z')).not.toBe(key);
    expect(eventEmailKey('reminder', 'reg', 'ticket', '2026-11-08T06:00:00Z')).not.toBe(key);
  });
  it('uses the live event page and stored price for both guest and member attendees', () => {
    const data = eventEmailData({ ticket_code: 'FEMP-1', quantity: 1, amount_paid_cents: 2900, currency: 'AED' }, { slug: 'builders-roundtable-09-the-agent-room', title: 'The Agent Room', starts_at: '2026-11-07T06:00:00Z', timezone: 'Asia/Dubai', location: 'Raw Coffee Company Dubai', cover_image_url: 'https://fempowerae.com/poster.jpg' }, 'Tejasvie');
    expect(data.eventUrl).toBe('https://fempowerae.com/events/builders-roundtable-09-the-agent-room');
    expect(data.amountPaid).toBe(29);
    expect(data.timezone).toBe('Asia/Dubai');
    expect(data.ticketCode).toBe('FEMP-1');
  });
});