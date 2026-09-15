-- Event pages show "<confirmed> / <capacity> registered" to everyone, including
-- guests. RLS on public.registrations only lets a user read their own rows, so a
-- direct client-side count returns 0 for anon and only the viewer's own seats for
-- authenticated users. public.event_confirmed_count(uuid) is SECURITY DEFINER and
-- returns just an aggregate seat count (no PII), so it is safe to expose to anon.
-- It was revoked from anon in 20260614113344 back when no anon caller used it.
GRANT EXECUTE ON FUNCTION public.event_confirmed_count(uuid) TO anon, authenticated;
