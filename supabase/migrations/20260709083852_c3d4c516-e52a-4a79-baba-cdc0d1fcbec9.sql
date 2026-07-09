
DROP POLICY IF EXISTS "Public can view event-photos files" ON storage.objects;

CREATE POLICY "Admins can list event-photos files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND public.has_role(auth.uid(), 'admin')
);
