
-- 1. Attach trigger to protect admin-only fields on member_profiles
DROP TRIGGER IF EXISTS protect_member_profile_admin_fields_trg ON public.member_profiles;
CREATE TRIGGER protect_member_profile_admin_fields_trg
BEFORE UPDATE ON public.member_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_member_profile_admin_fields();

-- 2. Tighten the update policy with WITH CHECK to block self-elevation
DROP POLICY IF EXISTS "Members update own profile" ON public.member_profiles;
CREATE POLICY "Members update own profile"
ON public.member_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      status IS NOT DISTINCT FROM (SELECT status FROM public.member_profiles WHERE user_id = auth.uid())
      AND approved_at IS NOT DISTINCT FROM (SELECT approved_at FROM public.member_profiles WHERE user_id = auth.uid())
      AND approved_by IS NOT DISTINCT FROM (SELECT approved_by FROM public.member_profiles WHERE user_id = auth.uid())
      AND is_trusted_poster IS NOT DISTINCT FROM (SELECT is_trusted_poster FROM public.member_profiles WHERE user_id = auth.uid())
    )
  )
);

-- 3. Add explicit SELECT policy for approved, non-banned members to read published posts
DROP POLICY IF EXISTS "Approved members read published posts" ON public.circle_posts;
CREATE POLICY "Approved members read published posts"
ON public.circle_posts
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND public.is_approved_member(auth.uid())
  AND NOT public.is_circle_banned(auth.uid())
);
