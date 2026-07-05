
-- 1) Revoke public/anon EXECUTE on internal SECURITY DEFINER email queue helpers.
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
-- Keep service_role and postgres owner able to execute (used by cron/trigger).
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;

-- 2) learn_resources: only show resources for published courses (or admins).
DROP POLICY IF EXISTS "Authenticated users can view resources" ON public.learn_resources;
CREATE POLICY "Authenticated users can view published resources"
  ON public.learn_resources
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.learn_courses c
      WHERE c.id = learn_resources.course_id
        AND (
          c.status = 'published'
          OR (c.status = 'scheduled' AND c.published_at <= now())
        )
    )
  );

-- 3) learn_wings: only show wings whose module + course are published (or admins).
DROP POLICY IF EXISTS "Authenticated users can view wings" ON public.learn_wings;
CREATE POLICY "Authenticated users can view published wings"
  ON public.learn_wings
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.learn_modules m
      JOIN public.learn_courses c ON c.id = m.course_id
      WHERE m.id = learn_wings.module_id
        AND (m.published_at IS NULL OR m.published_at <= now())
        AND (
          c.status = 'published'
          OR (c.status = 'scheduled' AND c.published_at <= now())
        )
    )
  );
