# FemPower — Feature Roadmap

> Brainstormed on June 28, 2026. Parked for future sessions.

---

## Shipped (June 28)

- [x] Learn tab with Course → Module → Wing hierarchy
- [x] Each wing: Context, Reflection (save + share), Extension (action + go further)
- [x] Progress tracking per wing, progress bar per course/module
- [x] Learning Journal — all reflections in one place
- [x] Admin CRUD panel (Courses, Modules, Wings, Resources — 4 tabs)
- [x] Publish scheduling (courses: draft/published/scheduled, modules: optional publish date)
- [x] Course 1: "Learn AI from Scratch" — 3 modules, 22 wings, fully seeded
- [x] Streak counter — consecutive day streak + wings this week
- [x] Wing of the Week — admin features a wing, shows on Learn page with WhatsApp share

---

## Courses to Build

- [ ] **Course 2: Build with AI (Work)** — from She Vibes Days 23-46 (Agents, Planning, Building, Shipping)
- [ ] **Course 3: Build with AI (Personal)** — from She Vibes Days 47-66 (Collaboration, Ethics, Challenge Week)

---

## Engagement Features (Brainstormed, Not Yet Built)

### Weekly Reflection Digest (#2)
Every Sunday, auto-email members a digest of their own reflections from the week. Low-effort to build (scheduled Supabase function + email), high emotional value. Ties into the journal feature.

### Cohort Mode (#3)
Let members opt into a cohort — a group of 10-15 women doing the same course together with a shared start date. Shared reflections become more meaningful when you know the other women reading yours. Even without live sessions, a cohort creates peer pressure and belonging.

### UAE-Specific Examples (#4)
Swap in Dubai-specific scenarios in wing content — salary conversations at Dubai multinationals, multicultural team dynamics, Ramadan work schedules, remote work with HQ in another timezone, visa sponsorship context.

### Completion Certificate (#5)
When someone finishes all wings in a course, generate a branded certificate they can share on LinkedIn. Shareable credential from FemPower. Low effort to build, high social proof value.

### Audio Option (#7)
Some wings would land harder as 2-minute audio — a voice note feel. Even just a quick intro per module adds warmth that text alone can't. Could be a recorded audio file uploaded per wing.

---

## Technical Improvements (Noticed During Build)

- [ ] Regenerate `src/integrations/supabase/types.ts` to include learn tables (currently using `as any` casts)
- [ ] Add bookmarking support for wings (extend existing BookmarkButton)
- [ ] Add search/filter to Learn page when course count grows past 5
- [ ] Consider rich text (markdown rendering) for wing content instead of plain whitespace-pre-wrap

---

---

## Competitive Edge Features (Brainstormed June 28)

### Private DMs Between Members
Members can't contact each other through the platform today. Add a "Request to Connect" button on directory profiles that sends an intro email or opens a simple messaging thread. Keeps connections inside FemPower instead of losing them to LinkedIn/Instagram.

### Job / Opportunity Board
UAE women face specific job market challenges — visa transfers, part-time roles, return-to-work after career breaks, freelance gigs. A curated board where members or partner companies post opportunities specifically for women in the UAE. No one owns this space.

### Visa & Legal Resource Hub
Spouse visa work permits, freelance licenses, mainland vs freezone, golden visa eligibility. A curated, always-updated resource section verified by members who've actually been through the process. The thing women Google and land on FemPower for.

### Interest-Based Sub-Circles
Allow topic-specific sub-circles within the Circle forum: "Founders Circle", "Mums in Tech", "New to Dubai", "Career Switchers." Each has its own feed. Members self-select. This is how communities scale without getting noisy.

### Event Replays & Content Library
Record events (hosted every 15 days). Upload replays behind the member gate. Over time this becomes a library that makes membership increasingly valuable — "Join now and get access to 50+ past sessions."

### Accountability Partnerships
Pair two members for a 4-week accountability sprint. Each sets one goal, they check in weekly via the platform. Simple shared card with two goals, two weekly check-in fields. Builds deep 1:1 bonds.

### "Ask the Community" AI Layer
Extend Zara (AI coach) to search anonymised Circle posts and shared reflections. "23 FemPower members have discussed this topic — here's what came up." Community-trained AI. No competitor has this.

### UAE Cultural Calendar Integration
Auto-surface relevant content and events around Ramadan, Eid, UAE National Day, International Women's Day, back-to-school season. Platform adapts to the month — featured wings change, event suggestions shift, coach prompts are contextual.

### Arabic Language Support
Even partial — reflection prompts in Arabic, coach that responds in Arabic, RTL layout. 40%+ of UAE population is Arabic-speaking. Most English-first platforms ignore this. A bilingual toggle on key pages would be a differentiator.

### Partner Dashboard for Corporates
Companies in the UAE want to support women's development (DEI budgets, Emiratisation goals). A partner page where companies sponsor events, fund course scholarships, or get branded access for their female employees. Revenue channel and a moat.

---

*Pick items from this list in future sessions. No priority order — discuss and decide what matters most at the time.*
