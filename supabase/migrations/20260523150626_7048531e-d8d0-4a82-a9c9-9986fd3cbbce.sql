
-- 1) Lock down site-images listing to admins (public URLs still work since bucket is public)
DROP POLICY IF EXISTS "Site images are publicly readable" ON storage.objects;
CREATE POLICY "Admins list site images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

-- 2) Revoke execute on internal trigger / onboarding functions
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_member_profile_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.member_profiles_tsv_trigger() FROM PUBLIC, anon, authenticated;
