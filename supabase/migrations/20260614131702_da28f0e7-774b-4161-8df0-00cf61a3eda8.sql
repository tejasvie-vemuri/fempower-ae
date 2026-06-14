
-- 1) Registrations: limit which columns authenticated members can UPDATE.
-- Admins and service_role keep full access.
REVOKE UPDATE ON public.registrations FROM authenticated;
GRANT UPDATE (cancellation_requested_at, cancellation_reason, updated_at)
  ON public.registrations TO authenticated;

-- 2) Member photos storage policies: restrict to authenticated only.
DROP POLICY IF EXISTS "Members upload own photo" ON storage.objects;
CREATE POLICY "Members upload own photo"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'member-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Members update own photo" ON storage.objects;
CREATE POLICY "Members update own photo"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'member-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'member-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Members delete own photo" ON storage.objects;
CREATE POLICY "Members delete own photo"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'member-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 3) Member profile insert: restrict to authenticated only.
DROP POLICY IF EXISTS "Members insert own profile" ON public.member_profiles;
CREATE POLICY "Members insert own profile"
  ON public.member_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
