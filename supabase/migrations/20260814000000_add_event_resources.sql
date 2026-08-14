-- Event resources: pre-reads, instructions, worksheets and recaps posted per event
-- from a single admin page, independent of event creation.

-- 1. Table
CREATE TABLE IF NOT EXISTS public.event_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'pre_read'
    CHECK (kind IN ('pre_read', 'instructions', 'worksheet', 'recap', 'link')),
  title TEXT NOT NULL,
  description TEXT,
  external_url TEXT,
  storage_path TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  visibility TEXT NOT NULL DEFAULT 'registered'
    CHECK (visibility IN ('public', 'registered', 'attended')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A resource is either an uploaded file or an external link, never neither.
  CONSTRAINT event_resources_target_present
    CHECK (external_url IS NOT NULL OR storage_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_event_resources_event_id
  ON public.event_resources(event_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_resources_storage_path
  ON public.event_resources(storage_path)
  WHERE storage_path IS NOT NULL;

-- 2. Grants
GRANT SELECT ON public.event_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_resources TO authenticated;
GRANT ALL ON public.event_resources TO service_role;

-- 3. Access helper.
-- SECURITY DEFINER so it can read event_resources/registrations without tripping
-- the RLS policy that calls it (the definer is the table owner, which RLS skips).
CREATE OR REPLACE FUNCTION public.can_view_event_resource(_user_id UUID, _resource_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_resources r
    JOIN public.events e ON e.id = r.event_id
    WHERE r.id = _resource_id
      AND (
        public.has_role(_user_id, 'admin')
        OR (
          r.is_published
          AND e.status IN ('published', 'completed')
          AND (
            r.visibility = 'public'
            OR (
              r.visibility = 'registered'
              AND EXISTS (
                SELECT 1 FROM public.registrations reg
                WHERE reg.event_id = r.event_id
                  AND reg.user_id = _user_id
                  AND reg.status = 'confirmed'
              )
            )
            OR (
              r.visibility = 'attended'
              AND EXISTS (
                SELECT 1 FROM public.registrations reg
                WHERE reg.event_id = r.event_id
                  AND reg.user_id = _user_id
                  AND reg.checked_in_at IS NOT NULL
              )
            )
          )
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_view_event_resource(UUID, UUID) TO anon, authenticated;

-- 4. RLS on the table
ALTER TABLE public.event_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View permitted event resources" ON public.event_resources;
CREATE POLICY "View permitted event resources"
ON public.event_resources FOR SELECT
USING (public.can_view_event_resource(auth.uid(), id));

DROP POLICY IF EXISTS "Admins can insert event resources" ON public.event_resources;
CREATE POLICY "Admins can insert event resources"
ON public.event_resources FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update event resources" ON public.event_resources;
CREATE POLICY "Admins can update event resources"
ON public.event_resources FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete event resources" ON public.event_resources;
CREATE POLICY "Admins can delete event resources"
ON public.event_resources FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. updated_at trigger
DROP TRIGGER IF EXISTS update_event_resources_updated_at ON public.event_resources;
CREATE TRIGGER update_event_resources_updated_at
BEFORE UPDATE ON public.event_resources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Locked preview.
-- Members who cannot open a resource still see that it exists, by title only.
-- Never returns storage_path or external_url for a locked row.
CREATE OR REPLACE FUNCTION public.list_event_resources(_event_id UUID)
RETURNS TABLE (
  id UUID,
  kind TEXT,
  title TEXT,
  description TEXT,
  external_url TEXT,
  storage_path TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  visibility TEXT,
  sort_order INTEGER,
  locked BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.kind,
    r.title,
    CASE WHEN unlocked.ok THEN r.description ELSE NULL END,
    CASE WHEN unlocked.ok THEN r.external_url ELSE NULL END,
    CASE WHEN unlocked.ok THEN r.storage_path ELSE NULL END,
    CASE WHEN unlocked.ok THEN r.file_name ELSE NULL END,
    CASE WHEN unlocked.ok THEN r.file_size_bytes ELSE NULL END,
    CASE WHEN unlocked.ok THEN r.mime_type ELSE NULL END,
    r.visibility,
    r.sort_order,
    NOT unlocked.ok
  FROM public.event_resources r
  JOIN public.events e ON e.id = r.event_id
  CROSS JOIN LATERAL (
    SELECT public.can_view_event_resource(auth.uid(), r.id) AS ok
  ) AS unlocked
  WHERE r.event_id = _event_id
    AND r.is_published
    AND e.status IN ('published', 'completed')
  ORDER BY r.sort_order, r.created_at;
$$;

GRANT EXECUTE ON FUNCTION public.list_event_resources(UUID) TO anon, authenticated;

-- 7. Private storage bucket.
-- Private, unlike event-photos: a pre-read is for the women in the room, so files
-- are served through short-lived signed URLs rather than a public path.
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-resources', 'event-resources', false)
ON CONFLICT (id) DO NOTHING;

-- Not restricted to `authenticated`: a resource marked visibility='public' must be
-- openable by a logged-out visitor, and can_view_event_resource already returns
-- false for anon on anything gated.
DROP POLICY IF EXISTS "Read permitted event-resources files" ON storage.objects;
CREATE POLICY "Read permitted event-resources files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-resources'
  AND EXISTS (
    SELECT 1 FROM public.event_resources r
    WHERE r.storage_path = storage.objects.name
      AND public.can_view_event_resource(auth.uid(), r.id)
  )
);

DROP POLICY IF EXISTS "Admins can upload event-resources" ON storage.objects;
CREATE POLICY "Admins can upload event-resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-resources'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can update event-resources" ON storage.objects;
CREATE POLICY "Admins can update event-resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-resources'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can delete event-resources" ON storage.objects;
CREATE POLICY "Admins can delete event-resources"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-resources'
  AND public.has_role(auth.uid(), 'admin')
);
