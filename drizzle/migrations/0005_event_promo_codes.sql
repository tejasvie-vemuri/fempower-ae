CREATE TABLE public.event_promo_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_-]{2,40}$'),
 discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
 discount_value integer NOT NULL CHECK (discount_value > 0),
 event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
 expires_at timestamptz,
 members_only boolean NOT NULL DEFAULT false,
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (discount_type <> 'percentage' OR discount_value <= 100)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_promo_codes TO authenticated;
GRANT ALL ON public.event_promo_codes TO service_role;
ALTER TABLE public.event_promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage promo codes" ON public.event_promo_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.registrations ADD COLUMN promo_code_id uuid REFERENCES public.event_promo_codes(id), ADD COLUMN promo_code text, ADD COLUMN discount_cents integer NOT NULL DEFAULT 0, ADD COLUMN checkout_amount_cents integer;
CREATE FUNCTION public.protect_registration_discount() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN
 IF auth.role() IN ('anon','authenticated') THEN
  IF TG_OP = 'INSERT' THEN
   IF NEW.promo_code_id IS NOT NULL OR NEW.promo_code IS NOT NULL OR NEW.discount_cents <> 0 OR NEW.checkout_amount_cents IS NOT NULL THEN RAISE EXCEPTION 'Discounts are server-managed'; END IF;
  ELSIF NEW.promo_code_id IS DISTINCT FROM OLD.promo_code_id OR NEW.promo_code IS DISTINCT FROM OLD.promo_code OR NEW.discount_cents IS DISTINCT FROM OLD.discount_cents OR NEW.checkout_amount_cents IS DISTINCT FROM OLD.checkout_amount_cents THEN RAISE EXCEPTION 'Discounts are server-managed'; END IF;
 END IF; RETURN NEW; END; $$;
CREATE TRIGGER protect_registration_discount BEFORE INSERT OR UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.protect_registration_discount();
CREATE FUNCTION public.confirm_discounted_registration(_registration_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.registrations%ROWTYPE; e public.events%ROWTYPE; used integer;
BEGIN
 SELECT * INTO r FROM public.registrations WHERE id = _registration_id;
 IF NOT FOUND OR r.checkout_amount_cents IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'Invalid discounted registration'; END IF;
 SELECT * INTO e FROM public.events WHERE id = r.event_id FOR UPDATE;
 IF e.status <> 'published' THEN RAISE EXCEPTION 'Event is not open'; END IF;
 SELECT COALESCE(sum(quantity),0) INTO used FROM public.registrations WHERE event_id=e.id AND status='confirmed' AND id<>r.id;
 IF e.capacity>0 AND used+r.quantity>e.capacity THEN RAISE EXCEPTION 'Not enough seats remaining'; END IF;
 UPDATE public.registrations SET status='confirmed', amount_paid_cents=0 WHERE id=r.id;
END; $$;
REVOKE ALL ON FUNCTION public.confirm_discounted_registration(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_discounted_registration(uuid) TO service_role;