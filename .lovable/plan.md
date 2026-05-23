# Member Directory — Plan

A searchable directory of Fempower members. Profiles are created automatically on signup, but only appear publicly to other members once an admin approves them. Built on Lovable Cloud (Postgres + Storage + RLS) so it stays stable well past 500+ members.

## User experience

**For members**
- New route `/directory` (logged-in only). Shows approved members in a responsive card grid.
- Search bar (name / role / company / bio) + filter chips: Industry, City, "Open to".
- Click a card → member detail drawer with full bio, LinkedIn, Instagram, website, interests.
- New route `/account/profile` — member edits their own profile, uploads a photo, fills tags, and sees their approval status badge (Pending / Approved / Hidden).

**For admins**
- New route `/admin/members` — list of all profiles with status filter, search, and Approve / Reject / Hide actions. Pending profiles surface at the top with a count badge.

**Entry points**
- New "Directory" link in the header (only visible to signed-in users).
- Card on the member's `/account/tickets` style hub linking to "Edit your profile".

## Data model (new table `member_profiles`)

Fields:
- `name`, `photo_url`, `role`, `company`, `city`, `bio` (short)
- `linkedin_url`, `instagram_url`, `website_url`
- `industry` (single select), `expertise_tags` (text[]), `interests` (text[])
- `looking_for` (text[]: mentoring, collabs, hiring, friendship, etc.)
- `why_here` (short text — "Why are you part of Fempower?")
- `status` ('pending' | 'approved' | 'hidden' | 'rejected'), `approved_at`, `approved_by`

A row is auto-created on signup via the existing `handle_new_user` trigger with `status='pending'`. The existing `profiles` table stays as-is for auth/contact info; `member_profiles` holds the public-facing directory data.

## Access rules (RLS)

- Member can read & update **their own** `member_profiles` row at any time.
- Any signed-in user can read rows where `status='approved'` (this powers the directory).
- Admins can read/update/delete all rows (approval workflow).
- Anonymous visitors see nothing.

## Search & performance (handles 500–10k+ rows easily)

- Postgres `GIN` index on a generated `tsvector` of name+role+company+bio+tags → fast full-text search.
- Indexes on `status`, `industry`, `city`.
- Query in pages of 24 with infinite scroll (React Query). Filters applied server-side.
- Photos stored in a new `member-photos` Storage bucket, served via CDN, resized at upload (max 800px) to keep payloads small.

## Technical details

- New files:
  - `src/pages/Directory.tsx`, `src/pages/MemberProfileEdit.tsx`, `src/pages/AdminMembers.tsx`
  - `src/components/directory/MemberCard.tsx`, `MemberDrawer.tsx`, `DirectoryFilters.tsx`, `PhotoUpload.tsx`
  - `src/hooks/useMemberProfile.ts`, `src/hooks/useDirectory.ts`
  - `src/lib/memberProfile.ts` (zod schema: trim, length caps, URL validation for LinkedIn/IG/website)
- DB migration: create `member_profiles`, RLS policies, indexes, `tsvector` trigger, `member-photos` bucket + policies, extend `handle_new_user` to seed a pending row.
- Header gets a "Directory" `NavLink` shown only when `useAuth().user` exists.
- Routes added in `src/App.tsx` under `ProtectedRoute` (members) and `AdminRoute` (admin page).

## Validation & safety

- zod-validated inputs on client and server (length limits, URL shape for `linkedin.com/in/...`, `instagram.com/...`).
- Photo upload: type + size check (≤ 5 MB, jpg/png/webp), stored under `{user_id}/avatar.{ext}`.
- No PII leaked: email and phone from `profiles` are never exposed in the directory.

## Out of scope (can come later)

- Direct messaging between members
- Member-to-member connection requests
- CSV import of existing members (can be added as an admin tool if needed)

Ready to build when you approve.
