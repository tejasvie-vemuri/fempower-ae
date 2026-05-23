ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS guests jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS registrations_quantity_check;
ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_quantity_check CHECK (quantity BETWEEN 1 AND 4);

CREATE OR REPLACE FUNCTION public.event_confirmed_count(_event_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(quantity), 0)::int FROM public.registrations
  WHERE event_id = _event_id AND status = 'confirmed';
$function$;