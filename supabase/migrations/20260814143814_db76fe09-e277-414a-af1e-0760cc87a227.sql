CREATE OR REPLACE FUNCTION public.confirm_free_registration(_event_id uuid, _responses jsonb DEFAULT '{}'::jsonb, _quantity integer DEFAULT 1, _guests jsonb DEFAULT '[]'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _event public.events%ROWTYPE;
  _used integer := 0;
  _registration_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_approved_member(_user_id) THEN
    RAISE EXCEPTION 'Membership required';
  END IF;

  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 4 THEN
    RAISE EXCEPTION 'Invalid ticket quantity';
  END IF;

  SELECT * INTO _event FROM public.events WHERE id = _event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF _event.status <> 'published' THEN
    RAISE EXCEPTION 'Event is not open for registration';
  END IF;

  IF _event.price_cents > 0 THEN
    RAISE EXCEPTION 'Event requires payment';
  END IF;

  IF _event.capacity > 0 THEN
    SELECT COALESCE(SUM(quantity), 0)::integer
    INTO _used
    FROM public.registrations
    WHERE event_id = _event.id
      AND status = 'confirmed'
      AND user_id <> _user_id;

    IF _quantity > (_event.capacity - _used) THEN
      RAISE EXCEPTION 'Not enough seats remaining';
    END IF;
  END IF;

  INSERT INTO public.registrations (
    event_id, user_id, status, amount_paid_cents, currency, responses, quantity, guests
  )
  VALUES (
    _event.id, _user_id, 'confirmed', 0, _event.currency,
    COALESCE(_responses, '{}'::jsonb), _quantity, COALESCE(_guests, '[]'::jsonb)
  )
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    status = 'confirmed',
    amount_paid_cents = 0,
    currency = EXCLUDED.currency,
    responses = EXCLUDED.responses,
    quantity = EXCLUDED.quantity,
    guests = EXCLUDED.guests,
    updated_at = now()
  RETURNING id INTO _registration_id;

  RETURN _registration_id;
END;
$function$;

DROP POLICY IF EXISTS "Users can join waitlist" ON public.waitlist;
CREATE POLICY "Approved members can join waitlist"
ON public.waitlist
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_approved_member(auth.uid()));