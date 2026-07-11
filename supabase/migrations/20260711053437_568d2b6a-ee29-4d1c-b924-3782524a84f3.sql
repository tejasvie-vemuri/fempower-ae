-- Allow admins to leave a feedback note and request changes
ALTER TABLE public.member_testimonials
  DROP CONSTRAINT IF EXISTS member_testimonials_status_check;

ALTER TABLE public.member_testimonials
  ADD CONSTRAINT member_testimonials_status_check
  CHECK (status IN ('pending','approved','rejected','changes_requested'));

ALTER TABLE public.member_testimonials
  ADD COLUMN IF NOT EXISTS feedback_note text;

-- Let members edit while pending OR while changes have been requested,
-- and re-submitting flips the row back to pending automatically.
DROP POLICY IF EXISTS "Members update own pending" ON public.member_testimonials;
CREATE POLICY "Members update own editable"
ON public.member_testimonials FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status IN ('pending','changes_requested'))
WITH CHECK (auth.uid() = user_id AND status IN ('pending','changes_requested'));

-- When a member updates their own testimonial (edits the text) after being
-- asked for changes, reset the status back to pending so admins re-review.
CREATE OR REPLACE FUNCTION public.member_testimonial_reset_on_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin')
     AND OLD.status = 'changes_requested'
     AND NEW.quote IS DISTINCT FROM OLD.quote THEN
    NEW.status := 'pending';
    NEW.feedback_note := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS member_testimonial_reset_on_edit ON public.member_testimonials;
CREATE TRIGGER member_testimonial_reset_on_edit
BEFORE UPDATE ON public.member_testimonials
FOR EACH ROW EXECUTE FUNCTION public.member_testimonial_reset_on_edit();