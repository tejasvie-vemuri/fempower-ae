CREATE POLICY "Admins can view all event photos"
ON public.event_photos
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));