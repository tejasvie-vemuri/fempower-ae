# Open events with guest registration

Today every event requires an approved membership to register. This adds an admin switch per event and a guest path for open events.

## Admin side

In the event create/edit form, a new toggle: **Members only** (on by default, so nothing changes for existing events).
- On: registration behaves exactly as today (sign in + approved member required).
- Off: the event is open to anyone; guests can register without an account.

The registrations list shows a "Guest" tag next to people who registered without an account, with their name, email, phone and LinkedIn.

## Visitor side (open events only)

On the event page, the register button opens a choice:
1. **Sign in / create account** — existing flow, unchanged.
2. **Continue as guest** — a short form asking name, email, phone number, and LinkedIn profile URL. All four required; email and phone are format-checked, LinkedIn must be a linkedin.com profile link.

Already signed in? No choice is shown — they register as today.

### If the guest's email already belongs to a member

Before creating anything, the email is checked against existing accounts. If it matches, the guest sees:

> Looks like you're already part of Fempower with this email. Please sign in to register — your ticket will be saved to your account.

with a Sign in button (and a "forgot password" link). No duplicate account and no guest record is created in that case.

### Confirmation

The guest gets the same registration confirmation email, with a ticket code. Guest tickets are looked up by that code rather than an account.

## Paid open events

Same choice screen. Guest details are collected first, then the guest goes to the normal payment checkout; the ticket is confirmed by the existing payment webhook.

## Technical notes

- `events` gets a `members_only boolean not null default true`; forms and admin list read/write it.
- `registrations` gets nullable `guest_name`, `guest_email`, `guest_phone`, `guest_linkedin_url` and `user_id` becomes nullable for guest rows (added as a new nullable path; existing rows untouched). Unique constraint changes from `(event_id, user_id)` to a partial unique index per path: `(event_id, user_id)` where user_id is not null, `(event_id, lower(guest_email))` where guest_email is not null.
- New edge function `guest-register` (service role, public, no JWT): validates input with Zod, rejects the event if `members_only` or not `published`, checks capacity, looks up the email in `auth.users`/`profiles` and returns `{ existing_member: true }` without writing, otherwise inserts a confirmed registration (free) or hands off to the existing checkout session flow (paid), then sends the confirmation email.
- RLS: no new anon access to `registrations`; all guest writes go through the service-role function. Admin and member policies stay as they are.
- Rate limiting: one registration per email per event, enforced by the partial unique index.
