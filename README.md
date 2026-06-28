# Fempower — Women's Community Platform

> Rooted Together, Rising Together.

Fempower is a members-only community platform for women in Dubai and the UAE.
It connects 300+ women across 15+ nationalities through mentorship, peer
coaching, in-person events, and a safe digital space for real conversations.

Live site → https://fempowerae.com

---

## What the platform does

| Feature | Description |
|---------|-------------|
| **Homepage** | Hero, About, Offerings, Programs spotlight, Events calendar, Gallery, Testimonials, FAQs |
| **Ask the Circle** | Members-only forum — post anonymously or by name, moderated by approved members |
| **Pop-up Meetups** | Member-hosted casual gatherings — RSVP or create your own |
| **Member Directory** | Searchable member profiles, gated behind auth |
| **Zara AI Coach** | AI career coach trained on UAE workplace context, powered by Google Gemini |
| **FemPower Learn** | Members-only learning platform — courses, modules, and bite-sized lessons called "Wings" (butterfly metaphor). Each wing has Context, Reflection (saved + optionally shared), and Extension (action). Progress tracking, learning journal, and admin CRUD panel with publish scheduling |
| **Auth** | Email/password + Google OAuth, admin-reviewed membership |
| **Legal** | Privacy Policy (UAE PDPL compliant) + Terms & Conditions |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend & Auth | Supabase (PostgreSQL, Row-Level Security, Storage) |
| AI | Google Gemini via Lovable AI Gateway |
| File Storage | Supabase Storage (private buckets, signed URLs) |
| Content | Google Sheets / Google Drive (events, frameworks, resources) |
| Newsletter | Substack |
| Community | WhatsApp + Instagram (@fempower.ae) |
| Built with | [Lovable](https://lovable.dev) |
| Domain | fempowerae.com |

---

## Pages & Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Homepage (all anchor sections) |
| `/circle` | Members only | Ask the Circle forum |
| `/meetups` | Members only | Pop-up meetups |
| `/directory` | Members only | Member directory |
| `/learn` | Members only | FemPower Learn — course listing with progress |
| `/learn/:courseId` | Members only | Course detail — modules, resources, progress bar |
| `/learn/:courseId/:moduleId` | Members only | Module detail — wing list with completion status |
| `/learn/:courseId/:moduleId/:wingId` | Members only | Wing — Context → Reflection → Extension learning flow |
| `/learn/journal` | Members only | Personal learning journal — all reflections in one place |
| `/admin/learn` | Admin only | Manage courses, modules, wings, and resources (CRUD) |
| `/auth` | Public | Sign in / Create account |
| `/privacy` | Public | Privacy Policy |
| `/terms` | Public | Terms & Conditions |

---

## User Roles

- **Visitor** — Browses public homepage, Zara chatbot, legal pages
- **Member** — Full access to Circle, Meetups, Directory after admin approval
- **Admin** — Moderates content, approves/removes members, manages events
- **Host** — Approved members who can create and manage pop-up meetups

---

## FemPower Learn — Data Model

| Table | Purpose |
|-------|---------|
| `learn_courses` | Top-level courses (title, description, emoji, status: draft/published/scheduled, published_at) |
| `learn_modules` | Sections within a course (title, description, optional published_at for scheduling) |
| `learn_wings` | Individual lessons — context, reflection prompt, extension/action, estimated minutes |
| `learn_resources` | Admin-managed external links per course |
| `learn_progress` | Tracks which wings a user has completed (unique per user+wing) |
| `learn_reflections` | User reflections per wing — saved, optionally shared with other members |

All tables use Row-Level Security. Content tables are readable by authenticated users. Progress and reflections are user-scoped. Admin-only write access on content tables.

### Scheduling

Courses support three statuses: `draft`, `published`, `scheduled`. When set to `scheduled` with a `published_at` timestamp, the course auto-appears to members once the time passes (enforced via RLS policy — no cron job needed). Modules can also have an optional `published_at` for drip-release of content.

---

## Community

- Instagram: [@fempower.ae](https://instagram.com/fempower.ae)
- LinkedIn: [linkedin.com/company/fempowerae](https://linkedin.com/company/fempowerae)
- To join: DM @fempower.ae on Instagram
