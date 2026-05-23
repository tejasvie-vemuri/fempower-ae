
-- 1) Protect admin-only fields on member_profiles
CREATE OR REPLACE FUNCTION public.protect_member_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
    NEW.is_trusted_poster := OLD.is_trusted_poster;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_member_profile_admin_fields ON public.member_profiles;
CREATE TRIGGER protect_member_profile_admin_fields
BEFORE UPDATE ON public.member_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_member_profile_admin_fields();

-- 2) Lock down member-photos storage
DROP POLICY IF EXISTS "Member photos public read" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can list member photos" ON storage.objects;

CREATE POLICY "Approved members, owners, admins read member photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'member-photos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_approved_member(auth.uid())
  )
);

UPDATE storage.buckets SET public = false WHERE id = 'member-photos';

-- 3) Migrate existing photo_url full URLs to storage paths
UPDATE public.member_profiles
SET photo_url = regexp_replace(photo_url, '^.*/storage/v1/object/(?:public|sign)/member-photos/', '')
WHERE photo_url LIKE '%/storage/v1/object/%/member-photos/%';
