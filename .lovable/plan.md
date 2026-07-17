
# Fempower engagement pack — implementation plan

Three connected features + one honest answer on bulk emails.

---

## 1. Weekly personalised digest email

A once-a-week email, sent Sunday 09:00 GST, that gives each approved member three concrete nudges.

**Sections**
- **An event for you** — next upcoming event, ideally matching a tag from her Directory interests / emirate; falls back to the soonest event.
- **A Circle post to reply to** — latest published Circle post she hasn't replied to (skip her own), preferring posts in topics she's tagged interested in.
- **A member to meet** — one approved Directory member she hasn't seen before, matched loosely on shared emirate/industry/interests.

Each section has a one-tap CTA button linking deep into the app (`/events/:id`, `/circle#post-:id`, `/directory?member=:id`) with UTM params so we can attribute clicks in analytics.

**Delivery**
- New app-email template `weekly-digest.tsx` styled like existing branded templates.
- New edge function `send-weekly-digest` that loops through approved, non-unsubscribed members, builds each recipient's personalised payload, and enqueues one `send-transactional-email` call per user with a per-week idempotency key (`weekly-digest-<userId>-<isoWeek>`).
- pg_cron job runs the edge function every Sunday 09:00 GST.
- Respects `suppressed_emails` and a per-user "digest opt-out" flag (new column on `member_profiles`).
- Members can unsubscribe from the digest specifically via the standard unsubscribe footer.

This is transactional-safe: each email is personalised, action-triggered by the recipient's own account state, and one recipient at a time — not a broadcast list.

---

## 2. Northstar analytics + baseline dashboard

**Northstar definition (encoded in one place)**

> A member is *connection-active* in a given ISO week if she performs ≥1 of: RSVP'd to an event, published a Circle post, replied in the Circle, RSVP'd to a Meetup, hosted a Meetup, completed a Learn module, or opened a Directory member profile.

**Instrumentation**
- New table `engagement_events` (user_id, event_type, target_id, created_at, metadata jsonb) with RLS: users can insert their own, admins can read all.
- Server-side triggers where the action already lives in the DB (RSVP insert, Circle post insert, meetup insert/rsvp insert, learn_progress upsert).
- Client-side call for view-based signals (Directory profile opened, digest click via UTM landing handler).
- Existing WhatsApp sticky CTA click also lands here (it already fires a `fempower:whatsapp_cta_click` window event — we just persist it).

**Admin dashboard at `/admin/northstar`** (admin-only route)
- **Big number**: WAM (weekly active members) this ISO week vs last week, with % delta.
- **Trend chart**: last 12 weeks of WAM.
- **Funnel**: Signed up → approved → first connection action → came back the following week (W2 retention).
- **Breakdown**: actions per member type (Circle, Events, Meetups, Learn, Directory) — which pillar is pulling engagement.
- **Time-to-first-action** median for members approved in the last 30 days.
- Filters: date range, emirate, approval cohort week.

The dashboard reads only from `engagement_events` + `member_profiles`, so we start with an empty baseline that fills in from the day we ship. Historical backfill for existing tables (registrations, circle_posts, meetup_rsvps, learn_progress) runs once during the migration so week 0 isn't empty.

---

## 3. "Introduce yourself" ritual — 48h post-approval

**Flow**
- When an admin approves a member (`member_profiles.status` moves to `approved`), we stamp `approved_at` (already exists) and add `intro_posted_at` (nullable).
- When the member publishes her first Circle post tagged `introduction`, we set `intro_posted_at = now()`.
- **In-app nudge**: on any authenticated page, if `approved_at` set, `intro_posted_at` null, and `now() - approved_at < 7 days`, show a soft dismissable banner on the homepage / Circle page: *"Welcome, [first name]. Tell the community who you are — a 3-line intro helps sisters find you."* with a "Write my intro" CTA that opens the Circle composer pre-loaded with the `introduction` topic tag and a prompt.
- **Email nudge**: single transactional email `intro-nudge.tsx` sent 48h ± 6h after approval if `intro_posted_at` is still null. Sent once per member (idempotency `intro-nudge-<userId>`).
- Adds a new `introduction` topic tag to Circle (if not already there) and a fresh empty-state on the Circle feed showing recent intros so new members see the pattern.

---

## 4. Your question about a bulk re-engagement email

I can't build the bulk "come back to the platform" campaign inside Lovable. Bulk / re-engagement / marketing emails aren't supported by the app-email system here — mixing broadcast marketing with a transactional sender damages deliverability for the emails members actually need (auth, RSVPs, receipts).

Two clean paths, both compatible with what we're building above:

1. **Let the weekly digest carry it.** The Sunday digest is personalised, wanted, and *is* your re-engagement lever — inactive members literally get "here's an event, a post, a sister." Expect a much higher open + click rate than a one-off blast.
2. **Use a marketing tool for true broadcasts.** Export the approved-member list to Mailchimp, Beehiiv, ConvertKit, or Substack (you already use Substack). Draft one intentional "we miss you" email there. I can build the export CSV + an admin page that lets you generate it whenever you want — just say the word.

---

## Technical details

- **DB migrations**: `engagement_events` table with grants + RLS + indexes; `member_profiles` gains `intro_posted_at`, `digest_opt_out`; DB triggers on `registrations`, `circle_posts`, `circle_replies`, `meetups`, `meetup_rsvps`, `learn_progress` to insert into `engagement_events`; one-time backfill.
- **New edge functions**: `send-weekly-digest`, `send-intro-nudges` (also cron), and the digest/intro React Email templates registered in `_shared/transactional-email-templates/registry.ts`.
- **Cron**: `send-weekly-digest` every Sunday 09:00 GST; `send-intro-nudges` hourly.
- **Frontend**: `/admin/northstar` page (admin-gated), homepage intro banner component, Circle composer pre-fill via query param, tiny helper `logEngagement(eventType, targetId?)` used from the few client-side entry points that don't have DB triggers.
- **Analytics wiring**: WhatsApp sticky click, digest email UTM landing (`?ref=digest&slot=event|circle|member`), Directory profile open, all funnel through `logEngagement`.

---

## Sequencing

1. Migrations (engagement_events, member_profiles columns, triggers, backfill).
2. `logEngagement` helper + client instrumentation.
3. `/admin/northstar` dashboard so we can see the baseline immediately.
4. Intro ritual (banner + email + composer pre-fill).
5. Weekly digest (template + edge function + cron).

Shall I proceed with all of it in this order, or trim/reorder anything first?
