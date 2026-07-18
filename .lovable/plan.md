## Goal
When a member submits her Spotlight story, admin should get a one-click **"Download LinkedIn Kit"** that produces a beautifully-branded FemPower spotlight image (like the Audacious Chronicles reference, but in FemPower's voice) + a ready-to-paste LinkedIn caption. Admin never has to design anything.

## What the member provides (expand the current form)

The current `spotlight_requests` form already collects: headline, the_before, the_turning_point, the_now, advice, shoutout, photo_url, consent_social. We'll add a few fields so the poster and caption write themselves with FemPower depth:

- **Role & company** (short, e.g. "CEO, Studio Layla")
- **One-line identity tag** (e.g. "Founder. Mother. First-gen entrepreneur.") — sits under the name on the poster
- **What she stopped waiting for** (short phrase, e.g. "permission to lead") — becomes the poster sub-headline in the FemPower voice
- **Pull-quote** (auto-suggested from `advice`, editable) — the italic highlighted line on the poster
- **Rally line / call to sisterhood** (optional, one sentence) — the closing "why FemPower" beat
- **Consent to LinkedIn publication** (separate from existing `consent_social`) + **tag me on LinkedIn** (optional LinkedIn URL)

All new fields optional except role, identity tag, and LinkedIn consent — story still works if a member skips the rest.

## The poster (LinkedIn-ready image)

A single square 1080×1080 PNG rendered in-browser via an offscreen HTML template + `html-to-image` (or `dom-to-image-more`), so we get pixel-perfect FemPower typography, real photos, and no server-side rendering cost.

Layout — inspired by the reference, re-skinned in FemPower's language:

```
  FEMPOWER · SPOTLIGHT SERIES · 2026
  ──────────────────────────────
  THE RISING
    CHRONICLES              (Playfair display, plum + gold)
  Vol. N · Rooted Together, Rising Together

  ┌──────────┐   She {stopped waiting for X}
  │  photo   │   and {turning-point verb phrase}.
  │  (b&w    │
  │  duotone │   {the_before → the_turning_point → the_now,
  │  plum)   │    tightened to 4–5 short lines}
  └──────────┘
  NAME                       "{pull-quote}"   ← italic, gold underline
  ROLE · COMPANY
                              {rally line}
  ──────────────────────────────
  FEMPOWERAE.COM   ·   Join the sisterhood   ·   [QR to /join]
```

FemPower vibes, not Audacious Chronicles copy:
- Serif: Playfair Display (already loaded). Body: DM Sans.
- Palette: Deep Plum #4A2040, Warm Gold #D4A853, Soft Ivory #FDF8F3 background.
- Gulf-inspired corner motif (reuse `GulfDecoratives`) instead of the octopus/hedgehog.
- Photo rendered as a plum duotone so every spotlight looks like part of one series.
- No stock "special edition" language — copy leans on FemPower's own vocabulary: "Rising Chronicles", "Rooted Together, Rising Together", "The sisterhood that made the room".

## The caption (ready-to-paste LinkedIn post)

Generated with Lovable AI (`google/gemini-2.5-flash`) from the member's answers, using a locked system prompt that encodes FemPower's voice and *why* — sisterhood over competition, women-only UAE community, permission-free leadership, rooted+rising. Structure:

1. Hook line (1 sentence, from headline + identity tag)
2. Her story compressed to 4–6 short lines (before → turning point → now)
3. Pull-quote on its own line, italicised with quotation marks
4. Why we're telling this — one line about what FemPower stands for, tailored to her arc
5. Tag line + LinkedIn handle if provided
6. Hashtags: `#FemPowerAE #RisingChronicles #WomenInUAE #CommunityOverCompetition` + 2 story-specific tags the AI picks

Admin sees the caption in an editable textarea before copy — nothing auto-publishes.

## Admin experience

New tab in `/admin/milestones` → **Story Requests** (already exists). On any `submitted` or `published` row, a **"LinkedIn Kit"** button opens a dialog:

- **Preview pane** — live render of the 1080×1080 poster (the actual DOM node we'll snapshot).
- **Caption pane** — editable textarea pre-filled by AI; "Regenerate" button re-runs the prompt.
- **Actions:** Download PNG, Copy caption, Copy caption + download PNG (single click), Mark as posted (stamps `linkedin_posted_at`).
- If member hasn't consented to LinkedIn, the button is disabled with a tooltip.

## Data changes

Extend `spotlight_requests` and `member_spotlights` with the same new columns:
`role_company`, `identity_tag`, `stopped_waiting_for`, `pull_quote`, `rally_line`, `linkedin_consent`, `linkedin_url`, `linkedin_posted_at`, `linkedin_caption` (cached last-generated caption).

All nullable, no data migration needed. RLS: same policies as existing columns on those tables (admin write, self-read on requests, public read on published spotlights).

## Technical bits (for the technical reviewer)

- New component `src/components/spotlight/LinkedInPoster.tsx` — pure JSX + inline styles + CSS variables from `index.css` so `html-to-image` captures colors correctly.
- New hook `useLinkedInKit(requestId)` — loads request + member profile + photo, calls edge function for caption, exposes `downloadPng()` and `regenerateCaption()`.
- New edge function `generate-spotlight-caption` — admin-only, calls Lovable AI with the locked FemPower system prompt, returns `{ caption }`. Rate-limited to 5/min per admin.
- `html-to-image` (~15KB) added to deps for the PNG snapshot.
- Poster fonts: preload Playfair + DM Sans in the poster component so the snapshot is deterministic.
- Photo duotone applied via CSS `filter` + a plum overlay `mix-blend-mode: color` (works in html-to-image).
- Storage: nothing new — the PNG is generated client-side and downloaded; we don't persist it.
- Guided-form update in `src/pages/ShareMyStory.tsx` — 3 new short-answer prompts + consent checkbox, using the existing question renderer, no route/UX overhaul.

## Out of scope for this plan

- Auto-posting to LinkedIn (would need OAuth + per-admin LinkedIn account; only offer if you explicitly want it — the connector exists but publishing needs the `w_member_social` scope granted to a specific LinkedIn account).
- Batch/carousel posters (multi-slide). Single-square first; carousel can come after we see one round in the wild.
- Video/animated versions.

## Deliverable order

1. Migration: add the new columns to `spotlight_requests` + `member_spotlights`.
2. Update `ShareMyStory` guided form + `STORY_QUESTIONS` in `spotlightRequests.ts`.
3. Build `LinkedInPoster` component (with a `/admin/spotlight-preview` sandbox route to iterate on the visual).
4. Edge function `generate-spotlight-caption` + registry.
5. Admin "LinkedIn Kit" dialog wired into `AdminMilestones`.
6. QA: render one real submitted request end-to-end, download the PNG, paste caption, eyeball on a LinkedIn draft.

Approve and I'll build in that order.
