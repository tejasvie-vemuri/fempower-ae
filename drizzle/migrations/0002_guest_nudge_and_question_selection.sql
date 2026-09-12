ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS enabled_default_questions text[];

COMMENT ON COLUMN public.events.enabled_default_questions IS
  'Subset of default attendee question IDs to ask. NULL means all defaults.';

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS guest_signup_nudge_sent_at timestamptz;