import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { sendTemplateEmail } from './transactional-email-templates/send-email.ts';
import { eventEmailData, eventEmailKey, isReminderDue } from './event-email-policy.ts';

export async function sendAttendeeEmail(db: SupabaseClient, registrationId: string, kind: 'confirmation' | 'reminder') {
  const { data: reg, error } = await db.from('registrations').select('*').eq('id', registrationId).maybeSingle();
  if (error) throw error;
  if (!reg || reg.status !== 'confirmed' || reg.cancellation_requested_at) return { skipped: true };
  const { data: event, error: eventError } = await db.from('events').select('*').eq('id', reg.event_id).maybeSingle();
  if (eventError) throw eventError;
  if (!event || event.status !== 'published') return { skipped: true };
  if (kind === 'reminder' && !isReminderDue(reg.status, event.status, event.starts_at)) return { skipped: true };
  const key = eventEmailKey(kind, reg.id, reg.ticket_code, event.starts_at);
  const column = kind === 'confirmation' ? 'event_confirmation_key' : 'event_reminder_key';
  if (reg[column] === key) return { skipped: true, reason: 'already_handled' };
  let email = reg.guest_email;
  let name = reg.guest_name;
  if (reg.user_id) {
    const { data: profile, error: profileError } = await db.from('profiles').select('email, name').eq('user_id', reg.user_id).maybeSingle();
    if (profileError) throw profileError;
    email = profile?.email; name = profile?.name;
  }
  if (!email) return { skipped: true, reason: 'no_recipient' };
  const templateName = kind === 'confirmation' ? 'event-registration-confirmation' : 'event-attendee-reminder';
  const result = await sendTemplateEmail(templateName, email, { templateData: eventEmailData(reg, event, name), idempotencyKey: key });
  const { error: stampError } = await db.from('registrations').update({ [column]: key }).eq('id', reg.id).eq('ticket_code', reg.ticket_code).eq('status', 'confirmed');
  if (stampError) throw stampError;
  // Diagnostic history only; Lovable owns delivery and suppression state.
  const { error: logError } = await db.from('email_send_log').insert({ message_id: null, template_name: templateName, recipient_email: email, status: result.sent ? 'sent' : 'suppressed' });
  if (logError) console.warn('Attendee email diagnostic log failed', logError.code);
  return result;
}