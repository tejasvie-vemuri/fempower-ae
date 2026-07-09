# Lifestyle Manager (Zoya) + The Pause — Feature Roadmap

> Started July 4, 2026. Keep this updated as the source of truth for what's actually shipped vs. still designed.

---

## Shipped

### Stage 1 — Core data model and dashboard (July 4)
- [x] Full schema: `lm_profile`, `people`, `important_dates`, `occasion_calendar`, `reminders`, `restaurant_venues`, `places_cache`, `booking_requests`, `grocery_items`, `chat_messages`, `approval_actions`, `google_calendar_tokens`, `plan_config`, `journal_entries`, `journal_nudge_settings`
- [x] Lifestyle Manager tab at `/lifestyle-manager`: Chat, Today, People, Groceries, History, Settings
- [x] Grocery list — add items, "Order via" Instashop/Noon/Talabat/Kibsons (copies list, opens the app, no cart automation without a partnership)
- [x] Admin settings at `/admin/lifestyle-manager` — trial length and price, editable, no code change needed
- [x] The Pause tab at `/the-pause` — gratitude / one thing learned / free text, saved entries browsable below

### Stage 2 — Zoya chat (July 4)
- [x] `zoya-chat` edge function with tool-calling: add a person, remember a date, add/complete a reminder, add a grocery item
- [x] Chat is the default tab, persists across sessions, other tabs refresh automatically when a tool changes her data

### Onboarding & first-use polish (July 5)
- [x] First-run naming modal — she names Zoya and sets what Zoya calls her, skippable, doesn't nag
- [x] Tappable example prompts in the empty chat state
- [x] City selector + notification preferences UI with debounced auto-save (no manual "Save" button)

### Notifications — Web Push + Email (July 5)
- [x] `push_subscriptions` table, service worker (`public/sw.js`), phone notification toggle in Settings
- [x] `send-lifestyle-digest` edge function — scheduled every 15 minutes via `pg_cron`, checks each member's own digest time, sends nothing if nothing's due
- [x] Email digest template (`lifestyle-digest`) reusing the existing transactional email system
- [x] Dedupe via `lm_profile.last_digest_sent_date` — never sends the same digest twice in a day
- [ ] **You still need to do these manual steps before this actually works, see below**

### Frictionless-UX pass (July 9)
- [x] Chat: a failed send restores her exact wording to the input, plus a one-tap Retry action on the error toast
- [x] Today/People/Groceries Add buttons show a spinner and disable while saving, no more duplicate-tap risk
- [x] Every reminder, date, person, and grocery item can be deleted, undoing a mistake is always one tap away
- [x] Real voice input: `transcribe-audio` edge function (Whisper via the Lovable AI gateway), tap-to-record mic in Chat, and The Pause's voice buttons now actually work instead of showing "coming soon". Transcribed text lands in the input box, never auto-sent, audio itself is never stored
- [ ] **New edge function needs deploying, see manual steps below**

---

## Parked — designed but not built yet

- [ ] **The Pause's adaptive nudge** — `journal_nudge_settings` table exists, but nothing sends the actual nudge yet (the one that backs off automatically after two misses, no guilt, no streaks)
- [ ] **Restaurant/event discovery** — Google Places search + enrichment, not connected
- [ ] **Google Calendar sync** — check her calendar before suggesting a time, write confirmed bookings back, not connected
- [ ] **Booking flow UI** — `booking_requests` table exists, no chat/UI path to actually suggest a venue, hand her to Google, or self-confirm yet
- [ ] **WhatsApp as a Zoya channel** — deliberately deferred, needs Meta Business verification (real lead time, start it whenever ready)
- [ ] **Phase 3 native app**

---

## Bug fixes (July 5)
- [x] Zoya now knows today's actual date, so relative phrases ("Thursday", "next month") resolve correctly instead of landing on hallucinated dates
- [x] Today shows every pending reminder and date regardless of how far out or overdue, no more 14-day cutoff hiding things that were actually saved
- [x] Yearly recurring dates (birthdays, anniversaries) count toward their next occurrence, not the raw stored date
- [x] A toast confirms the moment a chat action actually saves something, a second signal beyond Zoya's reply

---

## Ideas — brainstormed, not designed yet

Raised July 5, worth coming back to, none of these have a data model or a plan yet:

- [ ] **Document & bill renewal reminders** — Emirates ID, visa, trade license, car registration, DEWA, low-cost extension of the existing reminders system, mostly content and prompting, not new architecture
- [ ] **Meal planning → grocery list** — "what should I make this week" generates simple suggestions and drops the ingredients straight into Groceries
- [ ] **Ramadan-aware behavior** — Zoya shifts tone and digest timing during Ramadan, suhoor/iftar aware, same spirit as Zara's existing UAE-specific system prompt
- [ ] **Trusted service-provider directory** — peer-recommended plumber/AC repair/driving instructor type listings, probably a Circle/community feature more than a Zoya one
- [ ] **School logistics for working mums** — a distinct memory category for term dates, school runs, PTA reminders

---

## Manual steps outstanding right now

- [ ] Ask Lovable's agent to deploy the new `transcribe-audio` edge function (same pattern as `zoya-chat` and `send-lifestyle-digest` before it), voice input won't work until this is live
