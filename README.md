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

## Community

- Instagram: [@fempower.ae](https://instagram.com/fempower.ae)
- LinkedIn: [linkedin.com/company/fempowerae](https://linkedin.com/company/fempowerae)
- To join: DM @fempower.ae on Instagram
