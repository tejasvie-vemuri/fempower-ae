
-- 1. Table
CREATE TABLE public.event_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_photos_event_id ON public.event_photos(event_id, sort_order);

-- 2. Grants
GRANT SELECT ON public.event_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_photos TO authenticated;
GRANT ALL ON public.event_photos TO service_role;

-- 3. RLS
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view photos of published events"
ON public.event_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_photos.event_id
      AND e.status = 'published'
  )
);

CREATE POLICY "Admins can insert event photos"
ON public.event_photos FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update event photos"
ON public.event_photos FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete event photos"
ON public.event_photos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. updated_at trigger
CREATE TRIGGER update_event_photos_updated_at
BEFORE UPDATE ON public.event_photos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Storage RLS for event-photos bucket
CREATE POLICY "Public can view event-photos files"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-photos');

CREATE POLICY "Admins can upload event-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update event-photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete event-photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND public.has_role(auth.uid(), 'admin')
);
