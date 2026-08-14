DROP POLICY IF EXISTS "Authenticated users can view modules" ON public.learn_modules;

CREATE POLICY "Authenticated users can view modules"
ON public.learn_modules
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    (published_at IS NULL OR published_at <= now())
    AND EXISTS (
      SELECT 1 FROM public.learn_courses c
      WHERE c.id = learn_modules.course_id
        AND (
          c.status = 'published'
          OR (c.status = 'scheduled' AND c.published_at IS NOT NULL AND c.published_at <= now())
        )
    )
  )
);

REVOKE EXECUTE ON FUNCTION public.can_view_event_resource(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.list_event_resources(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_view_event_resource(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_event_resources(uuid) TO authenticated, service_role;