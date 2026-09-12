ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS members_only boolean NOT NULL DEFAULT true;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS guest_linkedin_url text;

ALTER TABLE public.registrations ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_identity_check
  CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_guest_email_key
  ON public.registrations (event_id, lower(guest_email))
  WHERE guest_email IS NOT NULL;
