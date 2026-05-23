
-- 1. Allow users to update their own coach conversations
CREATE POLICY "Users can update own conversations"
ON public.coach_conversations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Restrict directory visibility to approved members only
CREATE OR REPLACE FUNCTION public.is_approved_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_profiles
    WHERE user_id = _user_id AND status = 'approved'
  );
$$;

DROP POLICY IF EXISTS "Signed-in members view approved profiles" ON public.member_profiles;

CREATE POLICY "Approved members view approved profiles"
ON public.member_profiles
FOR SELECT
TO authenticated
USING (status = 'approved' AND public.is_approved_member(auth.uid()));

-- 3. Restrict storage.objects listing in member-photos bucket
-- Public bucket files remain accessible directly via public URL,
-- but listing/enumeration via the API is restricted to owners and admins.
DROP POLICY IF EXISTS "member-photos read" ON storage.objects;
DROP POLICY IF EXISTS "Public read member photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view member photos" ON storage.objects;

CREATE POLICY "Owners and admins can list member photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'member-photos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- 4. Lock down SECURITY DEFINER functions: revoke from anon/authenticated.
-- RLS policies invoke them via the definer's privileges, so revoking client EXECUTE is safe.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.event_confirmed_count(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.member_profiles_tsv_trigger() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_approved_member(uuid) FROM anon, authenticated, public;
