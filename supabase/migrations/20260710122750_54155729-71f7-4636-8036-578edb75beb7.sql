
-- 1) Restrict member_milestones SELECT to authenticated users
DROP POLICY IF EXISTS "Users can view approved milestones" ON public.member_milestones;
CREATE POLICY "Users can view approved milestones"
ON public.member_milestones
FOR SELECT
TO authenticated
USING (
  (status = 'approved' AND public.is_approved_member(auth.uid()))
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 2) Revoke anon EXECUTE on SECURITY DEFINER helper functions exposed via PostgREST
REVOKE EXECUTE ON FUNCTION public.get_meetups_public() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_meetup_hosts_public() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_circle_posts_public() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_meetups_public() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_meetup_hosts_public() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_circle_posts_public() TO authenticated;

-- 3) Harden meetup host identity masking: never expose host_id to non-host/non-admin
CREATE OR REPLACE FUNCTION public.get_meetups_public()
 RETURNS TABLE(id uuid, host_id uuid, title text, place text, emirate text, starts_at timestamp with time zone, capacity integer, note text, host_visibility text, status text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    m.id,
    CASE
      WHEN m.host_id = auth.uid() THEN m.host_id
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN m.host_id
      ELSE NULL
    END AS host_id,
    m.title, m.place, m.emirate, m.starts_at, m.capacity, m.note,
    m.host_visibility, m.status, m.created_at, m.updated_at
  FROM public.meetups m
  WHERE m.status = 'published'
    AND public.is_approved_member(auth.uid());
$function$;

CREATE OR REPLACE FUNCTION public.get_meetup_hosts_public()
 RETURNS TABLE(meetup_id uuid, host_id uuid, display_name text, photo_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    m.id AS meetup_id,
    CASE
      WHEN m.host_id = auth.uid() THEN m.host_id
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN m.host_id
      ELSE NULL
    END AS host_id,
    CASE
      WHEN mp.name IS NULL THEN NULL
      WHEN m.host_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN mp.name
      WHEN m.host_visibility = 'first_name' THEN split_part(mp.name, ' ', 1)
      WHEN m.host_visibility = 'full' THEN mp.name
      ELSE NULL
    END AS display_name,
    CASE
      WHEN m.host_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN mp.photo_url
      WHEN m.host_visibility = 'full' THEN mp.photo_url
      ELSE NULL
    END AS photo_url
  FROM public.meetups m
  LEFT JOIN public.member_profiles mp ON mp.user_id = m.host_id
  WHERE public.is_approved_member(auth.uid());
$function$;
