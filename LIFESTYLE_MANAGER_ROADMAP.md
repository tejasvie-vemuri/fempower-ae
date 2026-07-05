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

---

## Parked — designed but not built yet

- [ ] **Voice input for The Pause** — currently shows "coming soon," real version needs audio recording + server-side transcription, discard the audio after
- [ ] **The Pause's adaptive nudge** — `journal_nudge_settings` table exists, but nothing sends the actual nudge yet (the one that backs off automatically after two misses, no guilt, no streaks)
- [ ] **Restaurant/event discovery** — Google Places search + enrichment, not connected
- [ ] **Google Calendar sync** — check her calendar before suggesting a time, write confirmed bookings back, not connected
- [ ] **Booking flow UI** — `booking_requests` table exists, no chat/UI path to actually suggest a venue, hand her to Google, or self-confirm yet
- [ ] **WhatsApp as a Zoya channel** — deliberately deferred, needs Meta Business verification (real lead time, start it whenever ready)
- [ ] **Phase 3 native app**

---

## Manual steps outstanding right now

For the Web Push + email digest to actually go live:
1. Run the new migration (`20260705100000_add_digest_notifications.sql`) in the Supabase SQL editor
2. Before running it, create the cron secret in Vault (one-off, not committed to git, given to you separately in chat)
3. Add two Supabase Edge Function secrets: `VAPID_PRIVATE_KEY` and `DIGEST_CRON_SECRET`
4. Ask Lovable's agent to deploy the new `send-lifestyle-digest` edge function, same as `zoya-chat` before it
