
# Paid Event Registration Flow (Luma-style)

A full registration system for Fempower events: browse → sign in → pay with Stripe → receive emailed QR ticket. Capacity is enforced, sold-out events flip to a waitlist.

## User journey

```text
Calendar / Event card
        │
        ▼
Event detail page  ──── (sold out?) ──── Join waitlist
        │
        ▼
Sign in / Sign up  (email+password or Google)
        │
        ▼
Stripe Checkout (hosted)
        │
        ▼
Success page  ◄──── Stripe webhook confirms payment
        │
        ▼
Confirmation email with QR code ticket
        │
        ▼
"My tickets" dashboard (view / re-download QR)
```

Admin side: a protected `/admin` area to create/edit events, set price + capacity, view registrations, mark check-ins, export CSV. (Check-in scanner can be a fast-follow if you want to keep v1 lean — flag it in feedback.)

## What gets built

### 1. Data model (Lovable Cloud database)
- `events` — title, description, date, time, location, cover image, price (AED, in fils), capacity, status (draft/published/cancelled), slug
- `registrations` — event_id, user_id, status (`paid` / `refunded` / `cancelled`), stripe_session_id, stripe_payment_intent, ticket_code (UUID for QR), amount_paid, checked_in_at
- `waitlist` — event_id, user_id, position, notified_at
- `profiles` — name, email, phone (created on signup via trigger)
- `user_roles` + `app_role` enum (`admin`, `user`) with `has_role()` security-definer function — controls admin area access
- RLS on every table: users see only their own registrations/waitlist; events are public-read when `published`; admins can do everything via `has_role()`

Capacity is enforced server-side inside the webhook (atomic check using a Postgres function), not on the client — prevents double-booking.

### 2. Authentication
- Email + password and Google sign-in (Lovable Cloud managed OAuth — no Google Cloud setup needed)
- Auto-confirm OFF (users verify their email — standard)
- `/auth` page with sign-in + sign-up tabs
- Profile row auto-created on signup via DB trigger

### 3. Stripe payments (Lovable's built-in seamless Stripe)
- No Stripe account needed to start; test mode immediately, live after verification
- Tax handling: I'll suggest "tax calculation only" (Stripe collects correct VAT/tax, you handle filing) — confirm in feedback if you'd prefer full compliance handling or no tax automation
- Each event becomes a Stripe Product + Price; created via admin form
- **Edge functions:**
  - `create-checkout` — verifies seats available, creates Stripe Checkout Session, returns hosted URL
  - `stripe-webhook` — on `checkout.session.completed`: writes `registration` row (atomic capacity check), generates ticket code, queues confirmation email
  - `event-actions` — RPC for waitlist join/leave, registration cancel

### 4. Frontend pages / components
- **Event detail page** (`/events/:slug`): cover, description, price, seats remaining, "Register" or "Join waitlist" CTA, "Sold out" state
- **Registration confirmation** (`/events/:slug/success?session_id=...`): success state, ticket preview, "view in my tickets" link
- **My tickets** (`/account/tickets`): list of paid registrations with QR codes (rendered client-side via `qrcode` lib), downloadable
- **Admin** (`/admin/events`): table + create/edit form, registration list per event, check-in toggle, CSV export, waitlist view
- Existing calendar section + event cards link to new detail pages instead of WhatsApp RSVP (WhatsApp RSVP stays as a fallback for non-ticketed/free events — toggleable per event)

### 5. Capacity + waitlist
- Event card and detail page show "X seats left" (or "Sold out")
- When sold out, CTA becomes "Join waitlist"
- Admin can manually promote from waitlist → sends email "a seat opened, register here" with a 24h hold link
- Waitlist position is shown to the user

### 6. Email + QR ticket
- Custom sender domain (`hello@fempowerae.com` or similar — you confirm) via Lovable Email
- Transactional template: branded confirmation with event details + embedded QR (ticket_code)
- QR encodes the ticket UUID — admin scans/searches by it for check-in

### 7. Migration from Google Sheet
- One-time script: read current sheet via the existing `fetch-events` function, insert rows into `events` table as `published`, default price `0` / capacity `0` (= unlimited) so nothing breaks
- After migration, retire the sheet for events (other sheets stay)
- Existing event card UI keeps working — just sourced from DB

## Open decisions I need from you

1. **Currency** — AED only, or also USD?
2. **Email sender domain** — confirm `fempowerae.com` and the from-address (e.g. `events@fempowerae.com`)
3. **Refund policy** — self-serve cancel + refund up to X days before, or admin-only refunds?
4. **Check-in scanner UI** — include in v1 (camera-based QR scan on phone) or fast-follow? Manual search by name works without it.
5. **Stripe tax mode** — default to "calculation only" unless you want full compliance handling
6. **Who is the first admin?** — I'll grant the admin role to a user_id you give me after signup

## Implementation order (so you can ship incrementally)

1. Auth (email + Google), profiles, user_roles, admin role assignment
2. `events` + `registrations` + `waitlist` tables, RLS, migrate sheet data
3. Admin events CRUD (`/admin/events`)
4. Public event detail page + sold-out / waitlist states
5. Enable Stripe (test mode), `create-checkout` + `stripe-webhook`, success page
6. My tickets dashboard with QR
7. Email infrastructure + branded confirmation template
8. Admin registration list, CSV export, manual check-in
9. Polish: waitlist promotion email, refunds, switch Stripe to live

Each step is independently testable. We can stop after any one and you'll have something usable.

---

**Heads-up:** This is a sizable build — roughly 8 focused iterations. I'll execute step 1 first after you approve and we'll iterate from there.
