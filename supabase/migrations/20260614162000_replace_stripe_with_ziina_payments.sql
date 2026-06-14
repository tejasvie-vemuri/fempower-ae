ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_operation_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_id TEXT;

UPDATE public.registrations
SET
  payment_provider = COALESCE(payment_provider, 'stripe'),
  payment_intent_id = COALESCE(payment_intent_id, stripe_payment_intent_id),
  payment_operation_id = COALESCE(payment_operation_id, stripe_session_id)
WHERE stripe_payment_intent_id IS NOT NULL
   OR stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_payment_intent
  ON public.registrations(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_registrations_payment_provider
  ON public.registrations(payment_provider);

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
  NEW.payment_provider := OLD.payment_provider;
  NEW.payment_intent_id := OLD.payment_intent_id;
  NEW.payment_checkout_url := OLD.payment_checkout_url;
  NEW.payment_operation_id := OLD.payment_operation_id;
  NEW.refund_id := OLD.refund_id;
  NEW.checked_in_at := OLD.checked_in_at;

  RETURN NEW;
END;
$$;
