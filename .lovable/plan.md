## Goal
Give logged-out visitors a third path inside the "Join Fempower to continue" dialog: follow / DM us on Instagram, with a scannable QR code as the visual anchor.

## Where
`src/components/JoinGate.tsx` — the `Dialog` rendered by `JoinGateProvider`. No other files need to change; the dialog is already shown whenever a guest clicks a gated section (programs accordion, event link, etc.).

## Changes

1. **QR asset**
   - Generate one PNG at `src/assets/instagram-qr.png` encoding `https://www.instagram.com/fempower.ae` (the same handle already linked from the hero). Plain black-on-white square, ~512×512, no logo overlay — keeps it crisp and reliably scannable.
   - Import it in `JoinGate.tsx` as `instagramQr`.

2. **Dialog body**
   Restructure the dialog so it has two visual blocks separated by a subtle divider:

   ```text
   ┌───────────────────────────────┐
   │ Join Fempower to continue     │
   │ <description copy>            │
   │                               │
   │  [Sign In]   [Join Us]        │
   │ ─────── or follow us ──────── │
   │   ┌─────┐                     │
   │   │ QR  │  Scan to open       │
   │   │     │  @fempower.ae       │
   │   └─────┘  [Open Instagram ↗] │
   └───────────────────────────────┘
   ```

   - Keep the existing `DialogHeader` (title + description) and the existing `Sign In` / `Join Us` `DialogFooter` buttons unchanged.
   - Below the footer, add a new section:
     - Small uppercase divider label: `— or follow us —` using `text-xs font-body uppercase tracking-widest text-muted-foreground` with `border-t border-border` lines on either side.
     - Two-column row (`flex items-center gap-4`):
       - Left: `<img src={instagramQr} alt="Scan to open @fempower.ae on Instagram" className="w-24 h-24 rounded-md border border-border bg-white p-2" />`
       - Right: stacked text + button
         - Heading: `Join via Instagram` (`font-heading text-base`)
         - Subtext: `Scan the QR or tap below to follow @fempower.ae and DM us to join.` (`text-sm text-muted-foreground font-body`)
         - Button (outline, with `Instagram` icon from `lucide-react`): `Open Instagram` — opens `https://www.instagram.com/fempower.ae` in a new tab (`target="_blank" rel="noreferrer"`), and calls `setOpen(false)` on click so the dialog dismisses.

3. **Width**
   Bump `DialogContent` from `sm:max-w-md` to `sm:max-w-lg` so the QR + text row sits comfortably side-by-side on desktop. On mobile (default), the QR sits above the text via `flex-col sm:flex-row`.

## Design tokens
- Use existing semantic classes only (`text-muted-foreground`, `border-border`, `font-body`, `font-heading`). The QR image's white plate uses `bg-white` (intentional — QR codes need a white quiet zone to scan reliably; this is the one acceptable hardcoded color).

## Out of scope
- No new routes or auth changes.
- Authenticated users are unaffected — the dialog never opens for them.
- Hero Instagram icon and Join page CTAs stay as-is.
