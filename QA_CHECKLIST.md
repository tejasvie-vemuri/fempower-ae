# QA Checklist — Fempower AE

> Generated from full source code review of 19 pages, 30+ components, 447 commits.
> Last updated: June 2026

---

## Legend
- [ ] = Not yet tested
- [x] = Pass
- [~] = Partial / Bug found
- [!] = Fail

---

## 🔐 Auth & Password

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| A1 | Sign in — valid credentials | Redirect to intended page or `/` | [ ] |
| A2 | Sign in — invalid credentials | Toast: "Invalid login credentials" | [ ] |
| A3 | Sign in — empty email | Pink border + "Email is required" error text | [ ] |
| A4 | Sign in — empty password | Pink border + "Password is required" error text | [ ] |
| A5 | Sign in — invalid email format | "Please enter a valid email address" | [ ] |
| A6 | Sign in — redirect param preserved | After login from `/circle`, redirected to `/circle` not `/` | [ ] |
| A7 | Sign in — already logged in | Auto-redirected away, form never flashes | [ ] |
| A8 | Google OAuth — sign in | Google popup/redirect opens correctly | [ ] |
| A9 | Google OAuth — failure | Toast: "Google sign-in failed" | [ ] |
| A10 | Create account — valid | "Check your email to confirm your account" | [ ] |
| A11 | Create account — short password | "Password must be at least 6 characters" | [ ] |
| A12 | Create account — name required | Name field error shown | [ ] |
| A13 | Create account — existing email | Appropriate duplicate user error | [ ] |
| A14 | Forgot password — valid email | "If an account exists... a reset link is on its way" | [ ] |
| A15 | Forgot password — invalid email format | "Enter a valid email" inline error | [ ] |
| A16 | Forgot password — unregistered email | Same success message as A14 (no enumeration) | [ ] |
| A17 | Reset password — valid matching passwords | "Password updated" toast → redirect to `/auth` | [ ] |
| A18 | Reset password — mismatched passwords | "Passwords don't match" error | [ ] |
| A19 | Reset password — expired/invalid link | "This reset link is invalid or has expired" | [ ] |
| A20 | Reset password — password too short | "at least 6 characters" error | [ ] |
| A21 | Logo + tagline visible on `/auth` page | FemPower logo + tagline shown above form | [ ] |

---

## 💬 Ask the Circle

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| C1 | Login gate — unauthenticated user | Gate shown with "Sign in to join" | [ ] |
| C2 | Login gate — non-approved member | Gate shown with profile status message | [ ] |
| C3 | Post — below minimum length (< 10 chars) | Blocked with error | [ ] |
| C4 | Post — with topic tag selected | Post appears with correct tag attached | [ ] |
| C5 | Post — anonymous mode ON | Post shows "A sister in the circle" + heart icon | [ ] |
| C6 | Post — anonymous mode OFF | Post shows real display name + photo | [ ] |
| C7 | Post — exceeds 2000 char limit | Input blocked or truncated at 2000 chars | [ ] |
| C8 | Post — crisis-related content | Helpline resources shown alongside post | [ ] |
| C9 | Post — moderation pending state | Post enters pending review before going live | [ ] |
| C10 | Reply — below minimum length (< 2 chars) | Blocked with error | [ ] |
| C11 | Reply — valid submission | Reply appears under post with name + photo | [ ] |
| C12 | Reaction — add emoji | Count increments, button highlighted | [ ] |
| C13 | Reaction — remove (click again) | Count decrements, highlight removed | [ ] |
| C14 | Report — post | Flag → reason → submit logs to `circle_reports` | [ ] |
| C15 | Admin sees anonymous post author | Admin view reveals true authorship | [ ] |

---

## 👯 Pop-up Meetups

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| M1 | Login gate — unauthenticated | "Sign in to see what's on" shown | [ ] |
| M2 | Non-approved member gate | Profile status message shown, meetups hidden | [ ] |
| M3 | RSVP — join available meetup | Confirmed, user added to attendees | [ ] |
| M4 | RSVP — cancel (toggle off) | User removed from attendee list | [ ] |
| M5 | RSVP — meetup at capacity | Toast: "This meetup is full." — blocked | [ ] |
| M6 | Host meetup — all valid fields | Meetup created and visible in list | [ ] |
| M7 | Host meetup — date/time in the past | Rejected with past-time error | [ ] |
| M8 | Host meetup — title > 120 chars | Blocked at 120-char limit | [ ] |
| M9 | Host meetup — notes > 500 chars | Blocked at 500-char limit | [ ] |
| M10 | Host meetup — required fields empty | Validation errors on title/place/date | [ ] |
| M11 | Host visibility toggle — first name only | Host shown as first name only in listing | [ ] |
| M12 | Cancel meetup (as host) | Meetup hidden from all users | [ ] |
| M13 | Report meetup | Report logged with reason + optional notes | [ ] |
| M14 | Capacity limit enforced | 6th RSVP blocked when capacity = 5 | [ ] |

---

## 📋 Member Directory

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| D1 | Login gate | Redirected to `/auth?redirect=%2Fdirectory` | [ ] |
| D2 | Profile status alert — pending | Alert with "pending" status + edit link | [ ] |
| D3 | Profile status alert — rejected | Alert with "rejected" status + edit link | [ ] |
| D4 | Search by name | Matching members filtered in real time | [ ] |
| D5 | Filter by industry | Only selected industry members shown | [ ] |
| D6 | Filter by city | Only selected city members shown | [ ] |
| D7 | Filter by "looking for" | Filtered results appear correctly | [ ] |
| D8 | Clear all filters | All members reload | [ ] |
| D9 | Empty search result | "Clear filters" suggestion shown, no blank state | [ ] |
| D10 | Load more pagination | Next batch of members loads on click | [ ] |
| D11 | Member card → drawer | Click card opens side drawer with full profile | [ ] |
| D12 | Real-time member count | Correct total displayed (e.g. "175 members") | [ ] |
| D13 | Grid — desktop (1440px) | 3-column layout | [ ] |
| D14 | Grid — mobile (390px) | 1-column stacked layout | [ ] |

---

## 👤 Member Profile Edit

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| P1 | Load profile page | All existing fields pre-filled correctly | [ ] |
| P2 | Save valid profile | Success toast, data persisted to Supabase | [ ] |
| P3 | Bio — over 600 chars | Blocked at 600-char limit | [ ] |
| P4 | Why here — over 400 chars | Blocked at 400-char limit | [ ] |
| P5 | Photo upload | Photo URL updated, preview shown | [ ] |
| P6 | Social links saved | LinkedIn / Instagram / website URLs persisted | [ ] |
| P7 | Looking for — multi-select | All selections saved correctly | [ ] |
| P8 | Resubmit rejected profile | Status resets to "pending" on save | [ ] |
| P9 | Profile status badge | Correct status shown after each action | [ ] |

---

## 📅 Events

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| E1 | View event detail page | Title, description, date, location, price all shown | [ ] |
| E2 | Register — free event | Confirmed immediately, no payment step | [ ] |
| E3 | Register — paid event | Ziina hosted checkout opens | [ ] |
| E4 | Ziina — complete payment | Registration confirmed, ticket issued | [ ] |
| E5 | Ziina — cancel/fail checkout | Registration stays resumable | [ ] |
| E6 | Attendee questions shown | Custom questions appear before confirmation | [ ] |
| E7 | Attendee questions — required | Skipping required question blocks submission | [ ] |
| E8 | Capacity — seats remaining | Real-time remaining seat count shown | [ ] |
| E9 | Waitlist — join when full | Added to waitlist with position number | [ ] |
| E10 | Waitlist — leave | Removed from waitlist correctly | [ ] |
| E11 | Add to calendar | Calendar file/link generated correctly | [ ] |
| E12 | My Tickets page | All registered events listed at `/my-tickets` | [ ] |
| E13 | Admin — create event | Event live at correct URL after publish | [ ] |
| E14 | Admin — edit event | Changes reflected immediately | [ ] |
| E15 | Admin — delete event | Event + registrations removed | [ ] |
| E16 | Admin — draft vs published | Draft not visible to members | [ ] |
| E17 | Admin — waitlist toggle | Waitlist option appears to members when enabled | [ ] |
| E18 | Admin — view registrations | Attendee list visible with details | [ ] |

---

## 🛠️ Admin Panel

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| AD1 | Admin route guard | `/admin/*` blocked for regular members | [ ] |
| AD2 | Approve member | Status → approved, timestamp recorded | [ ] |
| AD3 | Reject member | Status → rejected | [ ] |
| AD4 | Hide member | Status → hidden, removed from directory | [ ] |
| AD5 | Unhide member | Status → approved, reappears in directory | [ ] |
| AD6 | Search members | Filters by name / role / company | [ ] |
| AD7 | Filter by status tab | Only that status shown with correct count | [ ] |
| AD8 | 200-record query limit | Admins aware records capped at 200 | [ ] |
| AD9 | Admin Circle — moderate reported posts | Reports cleared after admin action | [ ] |
| AD10 | Admin Images — upload gallery image | Image appears in GallerySection on homepage | [ ] |
| AD11 | Admin Registrations — view attendees | Full attendee data accessible | [ ] |

---

## 🏠 Homepage

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| H1 | Hero background image loads | Community photo renders correctly | [ ] |
| H2 | Zara CTA in hero | "Meet Zara" banner opens chat widget | [ ] |
| H3 | All nav anchor links | Each nav item smooth-scrolls to correct section | [ ] |
| H4 | Gallery — tab switching | Content switches between Instagram / uploaded tabs | [ ] |
| H5 | Instagram strip loads | Live feed renders (or cached fallback) | [ ] |
| H6 | Substack feed section | Articles/posts render correctly | [ ] |
| H7 | Testimonials carousel | Slides cycle correctly | [ ] |
| H8 | Becoming Space — "View All Frameworks" | All 12 frameworks revealed on click | [ ] |
| H9 | Resources section | Articles render with working links | [ ] |
| H10 | Newsletter signup | Confirmation shown or Substack redirect | [ ] |
| H11 | SEO meta tags | Title, description, OG tags correct in page source | [ ] |
| H12 | Structured data (JSON-LD) | HomeStructuredData valid in page source | [ ] |
| H13 | JoinGate — Instagram QR | QR code renders, links to correct Instagram | [ ] |

---

## 📱 Responsive / Mobile

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| R1 | Hamburger shown on mobile (< 768px) | Hamburger visible, full nav hidden | [ ] |
| R2 | Hamburger hidden on desktop (> 768px) | Hamburger has `md:hidden`, display:none confirmed | [x] |
| R3 | Hamburger — all nav links accessible | All 9 items + JOIN US in mobile menu | [x] |
| R4 | Directory grid — mobile | 1-column layout at 390px | [ ] |
| R5 | Login redirect — mobile | Redirected correctly after sign in on mobile | [ ] |
| R6 | Zara chat — mobile | Panel fits screen, input reachable, scrollable | [ ] |
| R7 | Event registration — mobile | Ziina hosted checkout opens and returns correctly | [ ] |

---

## 🔒 Security & Edge Cases

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| S1 | All protected routes without auth | `/circle`, `/meetups`, `/directory` redirect to auth | [x] |
| S2 | Admin routes as regular member | Blocked by AdminRoute guard | [ ] |
| S3 | Anonymous post — member vs admin view | Admin sees author, members see anonymous | [ ] |
| S4 | RLS — member data isolation | Member A cannot read Member B's private data | [ ] |
| S5 | coach_profiles security patch | Verify `5da5ef8` fix holds — no public access | [ ] |
| S6 | Password enumeration | Forgot password with unknown email gives same response | [ ] |
| S7 | No secrets in repo | `.env` excluded via `.gitignore` | [x] |
| S8 | Profile photos via signed URLs | Photos not accessible via public bucket URL | [ ] |

---

## ⚠️ Known Bugs (Open)

| # | Bug | Severity | Lovable Fix Prompt Ready |
|---|-----|----------|--------------------------|
| B1 | Empty form fields show pink border but no error message text | Medium | Yes |
| B2 | `/programs`, `/events`, `/join` return 404 instead of redirecting to `#` anchors | Medium | Yes |

---

## Test Summary

| Area | Total | Passed | Failed | Partial | Not Run |
|------|-------|--------|--------|---------|---------|
| Auth | 21 | 0 | 0 | 0 | 21 |
| Circle | 15 | 0 | 0 | 0 | 15 |
| Meetups | 14 | 0 | 0 | 0 | 14 |
| Directory | 14 | 0 | 0 | 0 | 14 |
| Profile Edit | 9 | 0 | 0 | 0 | 9 |
| Events | 18 | 0 | 0 | 0 | 18 |
| Admin | 11 | 0 | 0 | 0 | 11 |
| Homepage | 13 | 0 | 0 | 0 | 13 |
| Responsive | 7 | 2 | 0 | 0 | 5 |
| Security | 8 | 3 | 0 | 0 | 5 |
| **Total** | **110** | **5** | **0** | **0** | **105** |

---

*Update status as you test: `[ ]` → `[x]` pass, `[!]` fail, `[~]` partial*
