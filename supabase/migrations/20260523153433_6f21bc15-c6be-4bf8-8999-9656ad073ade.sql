-- 1) Anonymous post author exposure: restrict base-table reads to owner+admin,
--    serve everyone else through the security_invoker-free view.

DROP POLICY IF EXISTS "Approved members read published posts" ON public.circle_posts;

-- Recreate the view without security_invoker so it bypasses base-table RLS,
-- but enforce its own access checks in the WHERE clause.
DROP VIEW IF EXISTS public.circle_posts_public;

CREATE VIEW public.circle_posts_public
WITH (security_invoker = off) AS
SELECT
  p.id,
  p.topic_tag,
  p.body,
  p.is_anonymous,
  p.status,
  p.published_at,
  p.created_at,
  CASE WHEN p.is_anonymous THEN NULL::uuid ELSE p.user_id END AS user_id,
  CASE WHEN p.is_anonymous THEN NULL::text ELSE mp.name END AS author_name,
  CASE WHEN p.is_anonymous THEN NULL::text ELSE mp.photo_url END AS author_photo_url
FROM public.circle_posts p
LEFT JOIN public.member_profiles mp ON mp.user_id = p.user_id
WHERE p.status = 'published'
  AND public.is_approved_member(auth.uid())
  AND NOT public.is_circle_banned(auth.uid());

GRANT SELECT ON public.circle_posts_public TO authenticated;

-- 2) Registrations: add WITH CHECK and a trigger that prevents non-admins
--    from modifying sensitive columns.

DROP POLICY IF EXISTS "Users can update own registrations" ON public.registrations;

CREATE POLICY "Users can update own registrations"
ON public.registrations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.protect_registration_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.user_id := OLD.user_id;
  NEW.event_id := OLD.event_id;
  NEW.status := OLD.status;
  NEW.quantity := OLD.quantity;
  NEW.guests := OLD.guests;
  NEW.responses := OLD.responses;
  NEW.amount_paid_cents := OLD.amount_paid_cents;
  NEW.currency := OLD.currency;
  NEW.ticket_code := OLD.ticket_code;
  NEW.stripe_session_id := OLD.stripe_session_id;
  NEW.stripe_payment_intent_id := OLD.stripe_payment_intent_id;
  NEW.checked_in_at := OLD.checked_in_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_registration_fields_trg ON public.registrations;
CREATE TRIGGER protect_registration_fields_trg
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.protect_registration_fields();