# Event promo codes
- [x] Add secure admin configuration and server-side discount validation.
- [x] Add member and guest promo checkout with discounted payment verification.
- [x] Test discount rules and verify real admin persistence, signed-in and guest quotes, and members-only rejection.
- [ ] Verify a completed discounted payment — blocked: requires a real attendee/payment; no ticket or payment was fabricated.

# Attendee emails
- [x] Make confirmations use verified registration details and the public event link for members and guests.
- [x] Send each confirmed attendee one reminder around 24 hours before the event; skip cancelled bookings.
- [x] Deploy and verify template rendering, secure scheduled invocation, timing, and deduplication tests.
- [ ] Verify delivery for a real upcoming attendee — blocked: no confirmed upcoming registrations currently exist; no registration or payment was fabricated.