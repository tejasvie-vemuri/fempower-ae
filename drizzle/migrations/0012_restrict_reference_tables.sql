DROP POLICY IF EXISTS "Signed-in users can read places_cache" ON public.places_cache;
DROP POLICY IF EXISTS "Signed-in users can read occasion_calendar" ON public.occasion_calendar;
DROP POLICY IF EXISTS "Signed-in users can read restaurant_venues" ON public.restaurant_venues;
DROP POLICY IF EXISTS "Signed-in users can read plan_config" ON public.plan_config;
CREATE POLICY "Lifestyle users and admins read plan_config" ON public.plan_config
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.lm_profile p WHERE p.user_id = auth.uid()));