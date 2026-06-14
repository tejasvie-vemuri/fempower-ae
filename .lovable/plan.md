# Default attendee questions on event registration

Add 5 mandatory questions asked at checkout for every event, in a warm, quirky tone with emojis. These are global defaults (code-defined), merged with any custom per-event questions the admin has already added — so existing event-specific questions keep working.

## The 5 questions (all required)

Stable IDs so answers survive copy tweaks.

1. **`nibbles`** — single choice
   - "Nibbles & bites will be floating around — are you in? 🍇🧀"
   - Options: "Yes please, feed me 🙋‍♀️" · "I'll pass, thanks 🙅‍♀️"

2. **`dietary`** — short text
   - "Any food no-nos we should know about? 🌱🥜 (allergies, vegan, halal — spill it)"
   - Placeholder: "e.g. nut allergy, vegetarian, gluten-free…" (typing "none" is valid)

3. **`heard_about_us`** — single choice
   - "How did our little circle find you? 💌✨"
   - Options: Instagram · LinkedIn · A Fempower friend · WhatsApp community · An event/meetup · Somewhere else

4. **`instagram_follow`** — single choice with inline IG link
   - "One tiny ask — are you following us on Instagram yet? 📸💕 (@fempower.ae)"
   - Renders a tappable "Open Instagram ↗" link next to the question
   - Options: "Already there 💕" · "Just followed — see you in the DMs!" · "Will follow before the event 🤞"

5. **`media_consent`** — single choice (Yes or No, both valid)
   - "We sometimes capture the magic on camera 📷✨ — okay to feature you in photos/videos on our socials?"
   - Options: "Yes, tag me in 💃" · "No thanks, keep me off-camera 🙈"
   - Helper text: "Either answer is totally fine — we'll respect it on the day."

## Where they appear

`EventDetail.tsx` already renders `<AttendeeQuestionsForm>` driven by `parseQuestions(event.attendee_questions)`. The flow becomes:

```text
questions = [...DEFAULT_ATTENDEE_QUESTIONS, ...parseQuestions(event.attendee_questions)]
```

So defaults always show first, then any extra per-event questions the admin defined. The form already validates `required` per question — no validation change needed.

Same for free events (direct register) and paid events (Ziina checkout): both code paths build `responses` from the same form, so both get the new questions.

## Form rendering polish

`AttendeeQuestionsForm.tsx` currently uses a dropdown for `select`. To match the friendly tone:

- When `options.length <= 4`, render `select` as radio-style pill buttons instead of a dropdown.
- Special-case by question `id`:
  - `instagram_follow`: show "Open Instagram ↗" link (target=_blank, rel=noopener noreferrer) above the options, pointing to `https://instagram.com/fempower.ae`.
  - `media_consent`: render the helper line below the options.

No new question type — keeps the data model unchanged and existing admin editor compatible.

## Admin editor note

In `AttendeeQuestionsEditor.tsx`, add a small read-only banner: "5 default questions (nibbles, dietary, source, Instagram, media consent) are always asked — add extras below." So admins don't duplicate them.

## Admin registrations view

`AdminRegistrations.tsx` already displays `responses` keyed by question label, so the new answers appear automatically — no admin UI change required.

## Out of scope

- No DB migration — defaults live in code so copy/options can change without a migration.
- No admin toggle to disable defaults per event (can be added later if needed).
- No analytics tracking of `heard_about_us` aggregates (admin can review per registration).

## Files touched

- edit `src/lib/attendeeQuestions.ts` — export `DEFAULT_ATTENDEE_QUESTIONS`
- edit `src/pages/EventDetail.tsx` — merge defaults with event questions; always render the form
- edit `src/components/AttendeeQuestionsForm.tsx` — pill-radio for short option lists; Instagram link + media-consent helper by question id
- edit `src/components/admin/AttendeeQuestionsEditor.tsx` — info banner about defaults
