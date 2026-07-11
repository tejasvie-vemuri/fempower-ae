
CREATE TABLE public.testimonial_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  send_count integer NOT NULL DEFAULT 1,
  last_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonial_invites TO authenticated;
GRANT ALL ON public.testimonial_invites TO service_role;

ALTER TABLE public.testimonial_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage testimonial invites"
ON public.testimonial_invites
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_testimonial_invites_updated_at
BEFORE UPDATE ON public.testimonial_invites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
