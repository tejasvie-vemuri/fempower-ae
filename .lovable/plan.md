# Ask the Circle — Build Plan

A members-only support space where approved Fempower women can ask the hard questions (career, motherhood, mental health, money, relationships, faith, visa/legal, body & health) — choosing per post whether to share their name or stay anonymous.

## User flows

**Member**
1. Lands on `/circle` (teased from landing page) → if not signed in, sees description + sign-in CTA, no post preview.
2. After sign-in + approval, sees the feed: topic filter, pinned crisis-resource banner on sensitive tags.
3. Opens composer → picks tag → writes (max 2000 chars) → toggles **Post as [Name]** or **Post anonymously** → submits.
4. If post trips the crisis-keyword scan, a supportive modal with UAE helplines appears before submission completes; post is held for priority admin review.
5. If member is `is_trusted_poster = true` and no crisis flag → publishes immediately. Otherwise → pending queue.
6. Replies always show name + photo. Reactions: 🤍 🌷 💪 ✨ (one per user per item).
7. Report button on every post and reply.
8. Notifications: in-app badge on Circle nav, plus a WhatsApp deep-link button on each notification (pre-filled message to the moderator group or poster).

**Admin** (`/admin/circle`)
- Queues: Pending · Flagged (priority, crisis) · Reported · All.
- Per post: Approve, Hide, Delete, View real identity, Mark trusted/untrusted, Ban from feature.
- Real identity always visible to admins regardless of `is_anonymous`.

## Data model (new tables)

- `circle_posts` — `user_id`, `topic_tag`, `body`, `is_anonymous`, `status` (pending/published/hidden/deleted), `risk_level` (none/high), `flagged_keywords[]`, `published_at`, timestamps.
- `circle_replies` — `post_id`, `user_id`, `body`, `status`, timestamps. (Always attributed.)
- `circle_reactions` — `target_type` (post/reply), `target_id`, `user_id`, `emoji`. Unique on (target, user).
- `circle_reports` — `target_type`, `target_id`, `reporter_id`, `reason`, `notes`, `status`, timestamps.
- `circle_bans` — `user_id`, `banned_by`, `reason`, timestamps.
- Add `is_trusted_poster boolean default false` to `member_profiles`.

## RLS rules (summary, no SQL keywords here)

- Posts/replies readable by approved members only when `status = 'published'`; admins see everything.
- Public API never returns `user_id`, name, or photo for posts where `is_anonymous = true`.
- Members can create their own posts/replies/reactions/reports; cannot edit or delete others'.
- Trusted-flag and bans are admin-only.

## Crisis safety

- Server-side keyword list (suicide, self-harm, kill myself, hurt myself, abuse, beaten, rape, etc. — Arabic + English) checked in the submit edge function.
- High-risk posts → `risk_level='high'`, `status='pending'` always, surface top of admin queue, notify admins.
- Crisis banner pinned on Mental Health, Relationships, Body & Health tags with UAE helplines (DHA 800-HOPE, Aman 116111, DFWAC 800-111).

## Rate limits

- 3 posts / 24h, 20 replies / 24h, enforced in edge function using server-side count.

## Surfaces

- **Landing page**: small teaser card "A safe circle for the hard questions" → CTA to `/circle` (sign-in wall, no content preview).
- **`/circle`**: feed + composer (members only).
- **`/admin/circle`**: moderation dashboard (admin only).
- Nav badge with unread reply/approval counts.

## Phasing inside v1

Single ship, in this order so the preview is usable along the way:
1. Tables + RLS + edge function (`circle-submit`, `circle-moderate`).
2. `/circle` feed + composer + anonymity toggle.
3. Replies + reactions.
4. Reporting + admin dashboard.
5. Crisis keyword scan + helplines banner.
6. Landing-page teaser + nav badge + WhatsApp notification link.

## Technical notes

- Submit/report/moderate go through edge functions to enforce rate limits, run the keyword scan, and strip identity from public payloads.
- Public read uses a view (or careful select) that conditionally nulls `user_id`/name/photo when `is_anonymous = true`.
- WhatsApp notifications are `wa.me` deep links (no Twilio needed).
- Trusted flag is admin-toggled only — no auto-promotion logic.

Reply **approve** and I'll start with the migration.
