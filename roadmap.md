# Attendee emails
# Event promo codes
- [ ] Add secure admin configuration and server-side discount validation.
- [ ] Add member and guest promo checkout with discounted payment verification.
- [ ] Test discount rules and verify admin and registration flows.

- [x] Make confirmations use verified registration details and the public event link for members and guests.
- [x] Send each confirmed attendee one reminder around 24 hours before the event; skip cancelled bookings.
- [x] Deploy and verify template rendering, secure scheduled invocation, timing, and deduplication tests.
- [ ] Verify delivery for a real upcoming attendee — blocked: no confirmed upcoming registrations currently exist; no registration or payment was fabricated.