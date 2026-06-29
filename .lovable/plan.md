## Goal
Replace the header "Join Us" button for approved, signed-in members with a friendlier personalized affordance, while keeping it for guests and pending members.

## Behavior by auth state (header CTA slot, top-right)

- **Guest (signed out):** Show "Join Us" → `/join` (unchanged).
- **Signed in, pending/rejected/hidden:** Keep "Join Us" → `/join` (it shows their approval status page). Unchanged.
- **Signed in, approved member:** Hide "Join Us". Replace that slot with:
  1. A compact **"Hi, {firstName}"** chip linking to `/account/profile` (uses avatar if present, initials fallback).
  2. An **"Invite a sister"** button that opens a small share dialog (copy invite link to `/join`, plus WhatsApp + Instagram DM share buttons).
  
  Quick links (Circle, Learn, Directory, My Tickets) already exist in the main nav, so the replacement stays focused on identity + referral rather than duplicating nav.

## Files to change

- `src/components/Header.tsx` — branch the CTA slot on `useAuth` + `useMemberProfile().status`. Render `<JoinUsButton />` for guests/pending, otherwise render `<MemberHeaderActions />`.
- `src/components/MemberHeaderActions.tsx` *(new)* — greeting chip + "Invite a sister" trigger. Uses existing `MemberAvatar` for the chip.
- `src/components/InviteSisterDialog.tsx` *(new)* — shadcn `Dialog` with:
  - Prefilled share text: "I'm part of Fempower — a UAE women's circle. Come join us 🤍 https://fempowerae.com/join"
  - "Copy link" (uses `navigator.clipboard`, toast on success)
  - "Share on WhatsApp" (`https://wa.me/?text=...`)
  - "Share on Instagram" (opens `@fempower.ae` profile, since IG has no web share intent)

## Out of scope
- Mobile nav drawer mirrors the same logic (one extra branch in the existing mobile menu block in `Header.tsx`).
- No changes to the homepage `JoinSection` (already gated), Footer, or Hero CTA.
- No schema / backend changes.