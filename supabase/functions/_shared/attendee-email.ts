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
  if (kind === 'confirmation') {
    try { await sendAdminRegistrationNotice(db, reg, event, name, email); }
    catch (e) { console.error('Admin registration notice failed', reg.id, e instanceof Error ? e.message : e); }
  }
  const { error: stampError } = await db.from('registrations').update({ [column]: key }).eq('id', reg.id).eq('ticket_code', reg.ticket_code).eq('status', 'confirmed');
  if (stampError) throw stampError;
  // Diagnostic history only; Lovable owns delivery and suppression state.
  const { error: logError } = await db.from('email_send_log').insert({ message_id: null, template_name: templateName, recipient_email: email, status: result.sent ? 'sent' : 'suppressed' });
  if (logError) console.warn('Attendee email diagnostic log failed', logError.code);
  return result;
}
const money = (cents: number, cur: string) => `${(cur || 'AED').toUpperCase()} ${(cents / 100).toFixed(2)}`;
const humanize = (k: string) => k.replace(/[_-]+/g, ' ');
const show = (v: unknown) => Array.isArray(v) ? v.join(', ') : typeof v === 'object' && v ? JSON.stringify(v) : String(v ?? '');

// deno-lint-ignore no-explicit-any
async function sendAdminRegistrationNotice(db: SupabaseClient, reg: any, event: any, name?: string | null, email?: string | null) {
  let phone = reg.guest_phone as string | null;
  let memberStatus = 'Guest (not signed in)';
  if (reg.user_id) {
    const [{ data: prof }, { data: member }] = await Promise.all([
      db.from('profiles').select('phone').eq('user_id', reg.user_id).maybeSingle(),
      db.from('member_profiles').select('status').eq('user_id', reg.user_id).maybeSingle(),
    ]);
    phone = prof?.phone ?? phone;
    memberStatus = member?.status === 'approved' ? 'Fempower member' : member ? `Signed up, membership ${member.status}` : 'Has an account, not a member yet';
  }
  const labels: Record<string, string> = {};
  for (const q of (Array.isArray(event.attendee_questions) ? event.attendee_questions : [])) {
    if (q && (q.id || q.key)) labels[q.id || q.key] = q.label || q.question || q.id || q.key;
  }
  const answers = Object.entries(reg.responses || {}).map(([k, v]) => ({ label: labels[k] || humanize(k), value: show(v) }));
  const guests = (Array.isArray(reg.guests) ? reg.guests : []).map((g: Record<string, unknown>, i: number) => ({ label: `Guest ${i + 1}`, value: Object.values(g || {}).filter(Boolean).map(show).join(' · ') }));
  const details = [
    { label: 'Name', value: name || '' },
    { label: 'Email', value: email || '' },
    { label: 'WhatsApp', value: phone || '' },
    ...(reg.guest_linkedin_url ? [{ label: 'LinkedIn', value: reg.guest_linkedin_url }] : []),
    { label: 'Tickets', value: String(reg.quantity ?? 1) },
    { label: 'Ticket code', value: reg.ticket_code },
  ];
  const full = (reg.checkout_amount_cents ?? reg.amount_paid_cents) + (reg.discount_cents || 0);
  const payment = [
    { label: 'Paid', value: reg.amount_paid_cents > 0 ? money(reg.amount_paid_cents, reg.currency) : 'Free' },
    ...(reg.promo_code ? [
      { label: 'Coupon', value: `${reg.promo_code} (−${money(reg.discount_cents || 0, reg.currency)})` },
      { label: 'Full price', value: money(full, reg.currency) },
    ] : [{ label: 'Coupon', value: 'None' }]),
    ...(reg.payment_provider ? [{ label: 'Paid via', value: reg.payment_provider }] : []),
  ];
  const eventWhen = new Date(event.starts_at).toLocaleString('en-GB', { timeZone: event.timezone || 'Asia/Dubai', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  await sendTemplateEmail('admin-new-registration', 'tejasvie59@gmail.com', {
    templateData: { eventTitle: event.title, eventWhen, attendeeName: name || email || 'Someone', memberStatus, details, answers, guests, payment },
    idempotencyKey: `admin-registration-${reg.id}-${reg.ticket_code}`,
  });
}
