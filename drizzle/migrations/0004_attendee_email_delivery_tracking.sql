ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS event_confirmation_key text, ADD COLUMN IF NOT EXISTS event_reminder_key text;
COMMENT ON COLUMN public.registrations.event_confirmation_key IS 'Last handled confirmation for this ticket; managed by server only.';
COMMENT ON COLUMN public.registrations.event_reminder_key IS 'Last handled reminder for this ticket and event start; managed by server only.';
UPDATE public.registrations SET event_confirmation_key = 'event-confirmation-' || id::text || '-' || ticket_code WHERE status = 'confirmed' AND event_confirmation_key IS NULL;
CREATE OR REPLACE FUNCTION public.protect_attendee_email_tracking() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN IF auth.role() IN ('anon', 'authenticated') AND (NEW.event_confirmation_key IS DISTINCT FROM OLD.event_confirmation_key OR NEW.event_reminder_key IS DISTINCT FROM OLD.event_reminder_key) THEN RAISE EXCEPTION 'Email delivery tracking is server-managed'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER protect_attendee_email_tracking BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.protect_attendee_email_tracking();
REVOKE ALL ON FUNCTION public.protect_attendee_email_tracking() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_attendee_email_tracking() TO service_role;