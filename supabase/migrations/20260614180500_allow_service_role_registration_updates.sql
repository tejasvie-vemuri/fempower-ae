CREATE OR REPLACE FUNCTION public.protect_registration_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
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
  NEW.payment_provider := OLD.payment_provider;
  NEW.payment_intent_id := OLD.payment_intent_id;
  NEW.payment_checkout_url := OLD.payment_checkout_url;
  NEW.payment_operation_id := OLD.payment_operation_id;
  NEW.refund_id := OLD.refund_id;
  NEW.checked_in_at := OLD.checked_in_at;

  RETURN NEW;
END;
$$;
