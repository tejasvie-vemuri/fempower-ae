-- Member testimonials with admin approval
CREATE TABLE public.member_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote text NOT NULL CHECK (char_length(quote) BETWEEN 20 AND 400),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_testimonials TO authenticated;
GRANT ALL ON public.member_testimonials TO service_role;

ALTER TABLE public.member_testimonials ENABLE ROW LEVEL SECURITY;

-- Members submit their own; forced pending via trigger below
CREATE POLICY "Members insert own testimonial"
ON public.member_testimonials FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_approved_member(auth.uid())
  AND status = 'pending'
  AND approved_at IS NULL
  AND approved_by IS NULL
);

-- Members read their own submissions (any status)
CREATE POLICY "Members read own testimonial"
ON public.member_testimonials FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Members can edit own while still pending
CREATE POLICY "Members update own pending"
ON public.member_testimonials FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Members delete own pending"
ON public.member_testimonials FOR DELETE TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Admins full access
CREATE POLICY "Admins manage testimonials"
ON public.member_testimonials FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Prevent members from self-approving on update
CREATE OR REPLACE FUNCTION public.protect_member_testimonial_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_testimonial_admin_fields
BEFORE UPDATE ON public.member_testimonials
FOR EACH ROW EXECUTE FUNCTION public.protect_member_testimonial_admin_fields();

CREATE TRIGGER member_testimonials_updated_at
BEFORE UPDATE ON public.member_testimonials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public-safe read: only approved rows, only first name of the author
CREATE OR REPLACE FUNCTION public.get_testimonials_public()
RETURNS TABLE(id uuid, quote text, first_name text, approved_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    t.id,
    t.quote,
    split_part(coalesce(mp.name, ''), ' ', 1) AS first_name,
    t.approved_at
  FROM public.member_testimonials t
  LEFT JOIN public.member_profiles mp ON mp.user_id = t.user_id
  WHERE t.status = 'approved'
  ORDER BY t.approved_at DESC NULLS LAST
  LIMIT 30;
$$;

REVOKE EXECUTE ON FUNCTION public.get_testimonials_public() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_testimonials_public() TO authenticated;