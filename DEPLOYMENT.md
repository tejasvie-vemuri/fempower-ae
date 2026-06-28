# Deployment Guide — Fempower

This project was built using [Lovable](https://lovable.dev).
All infrastructure is managed through Lovable + Supabase.

---

## Prerequisites

- Lovable account (lovable.dev)
- Supabase project
- Google Cloud project (for Gemini AI + OAuth)
- Custom domain (optional)

---

## Environment & Services Setup

### 1. Supabase
- Create a new Supabase project
- Enable Email/Password and Google OAuth providers under Authentication → Providers
- Set up Row-Level Security (RLS) on all tables so members only access permitted data
- Create a private storage bucket for member profile photos (access via signed URLs)
- Add your Supabase URL and anon key to Lovable project settings

### 2. Google OAuth
- Create OAuth 2.0 credentials in Google Cloud Console
- Add your site domain to authorised redirect URIs
- Paste client ID and secret into Supabase Auth → Google provider settings

### 3. Zara AI Coach (Google Gemini)
- Enable Gemini API in Google Cloud Console
- Add API key to Lovable AI settings
- Coach conversations are saved per user account in Supabase

### 4. Domain
- Point your domain DNS to Lovable's hosting
- Add domain in Lovable project → Settings → Custom Domain
- SSL is provisioned automatically

### 5. Ziina Payments
- Complete Ziina onboarding and verify the receiving account before enabling paid events
- Generate a Ziina access token with payment intent, webhook, and refund scopes
- Add Supabase Edge Function secrets:
  - `ZIINA_ACCESS_TOKEN`
  - `ZIINA_WEBHOOK_SECRET`
  - `ZIINA_TEST_MODE` (`true` for test payments; set to `false` only after a real production readiness check)
  - `PUBLIC_SITE_URL` (for example, `https://fempowerae.com`)
- Register the Supabase `payments-webhook` Edge Function URL in Ziina using the same webhook secret
- Register or overwrite the Ziina webhook with:
  ```bash
  curl --request POST \
    --url https://api-v2.ziina.com/api/webhook \
    --header "Authorization: Bearer $ZIINA_ACCESS_TOKEN" \
    --header "Content-Type: application/json" \
    --data '{"url":"https://uaiymunelgvvnznkxeik.supabase.co/functions/v1/payments-webhook","secret":"'"$ZIINA_WEBHOOK_SECRET"'"}'
  ```
- Run one test payment intent and one refund before publishing paid events

---

## Deploying via Lovable

1. Open your project at [lovable.dev](https://lovable.dev)
2. Click **Share → Publish**
3. To connect a custom domain: **Settings → Custom Domain → Add Domain**
4. All environment variables (Supabase keys, Gemini key) are managed inside Lovable settings — never commit them to this repo

---

## Data & Privacy

- Platform complies with UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021)
- Member data stays within the platform — not sold or shared with third parties
- AI coach conversations are stored per account and used only to deliver responses
- Some service providers (Supabase, Google) may process data outside UAE under contractual safeguards

---

## FemPower Learn — Database Setup

The Learn feature requires 6 tables + RLS policies. Run these migrations in order via the Supabase SQL Editor:

1. **`supabase/migrations/20260628000000_add_learn_tables.sql`** — Creates all 6 tables (`learn_courses`, `learn_modules`, `learn_wings`, `learn_resources`, `learn_progress`, `learn_reflections`) with indexes, RLS policies, and triggers.

2. **`supabase/migrations/20260628100000_add_learn_scheduling.sql`** — Adds `published_at` column to courses and modules, adds `scheduled` status option, and updates RLS policies for time-based auto-publishing.

3. **`supabase/seed_learn_course1.sql`** (optional) — Seeds "Learn AI from Scratch" course with 3 modules and 22 wings of content.

4. **`supabase/update_wing_actions.sql`** (optional) — Updates all 22 wings with concrete Action + Go Further steps.

### Managing Content

- Admin panel at `/admin/learn` provides full CRUD for courses, modules, wings, and resources
- Courses can be Draft (hidden), Published (live now), or Scheduled (goes live at a set date/time)
- Modules can have an optional publish date for drip-releasing content
- Resources are auto-published when added (no draft state)

---

## Known Route Behaviour

Direct navigation to `/programs`, `/events`, `/join` returns a 404 because
these are anchor sections on the homepage (`#programs`, `#events-calendar`,
`#join`), not standalone pages. Fix: add server-side redirects or update
the hamburger nav links to use anchor hrefs.

---

## Contact

hello@fempowerae.com
