DROP POLICY IF EXISTS "Members insert own profile" ON public.member_profiles;

CREATE POLICY "Members insert own profile"
ON public.member_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND approved_at IS NULL
  AND approved_by IS NULL
  AND is_trusted_poster = false
);