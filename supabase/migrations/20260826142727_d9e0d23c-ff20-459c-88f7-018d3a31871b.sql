ALTER TABLE public.meetups
  ALTER COLUMN host_visibility SET DEFAULT 'first_name';

ALTER TABLE public.meetups
  DROP CONSTRAINT IF EXISTS meetups_host_visibility_check;

ALTER TABLE public.meetups
  ADD CONSTRAINT meetups_host_visibility_check
  CHECK (host_visibility IN ('full','first_name'));