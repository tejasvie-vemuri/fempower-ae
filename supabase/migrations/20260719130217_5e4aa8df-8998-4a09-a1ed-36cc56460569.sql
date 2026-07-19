
-- Tighten circle_reactions SELECT so members can only see reactions on published
-- posts/replies they can actually access.
DROP POLICY IF EXISTS "Approved members read reactions" ON public.circle_reactions;

CREATE POLICY "Approved members read reactions on visible targets"
ON public.circle_reactions
FOR SELECT
USING (
  is_approved_member(auth.uid())
  AND NOT is_circle_banned(auth.uid())
  AND (
    (target_type = 'post' AND EXISTS (
      SELECT 1 FROM public.circle_posts p
      WHERE p.id = circle_reactions.target_id
        AND p.status = 'published'
    ))
    OR
    (target_type = 'reply' AND EXISTS (
      SELECT 1
      FROM public.circle_replies r
      JOIN public.circle_posts p ON p.id = r.post_id
      WHERE r.id = circle_reactions.target_id
        AND r.status = 'published'
        AND p.status = 'published'
    ))
  )
);

-- Defense-in-depth: keep the raw meetups table locked to host/admin only, and
-- ensure the public-facing RPCs mask host identity per host_visibility.
-- (Re-create the masking functions to guarantee current logic is in place.)
CREATE OR REPLACE FUNCTION public.get_meetups_public()
RETURNS TABLE (
  id uuid, host_id uuid, title text, place text, emirate text,
  starts_at timestamptz, capacity integer, note text,
  host_visibility text, status text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    CASE
      WHEN m.host_id = auth.uid() THEN m.host_id
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN m.host_id
      WHEN m.host_visibility = 'full' THEN m.host_id
      ELSE NULL
    END AS host_id,
    m.title, m.place, m.emirate, m.starts_at, m.capacity, m.note,
    m.host_visibility, m.status, m.created_at, m.updated_at
  FROM public.meetups m
  WHERE m.status = 'published'
    AND public.is_approved_member(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.get_meetup_hosts_public()
RETURNS TABLE (
  meetup_id uuid, host_id uuid, display_name text, photo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id AS meetup_id,
    CASE
      WHEN m.host_id = auth.uid() THEN m.host_id
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN m.host_id
      WHEN m.host_visibility = 'full' THEN m.host_id
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
$$;

REVOKE EXECUTE ON FUNCTION public.get_meetups_public() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_meetup_hosts_public() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_meetups_public() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_meetup_hosts_public() TO authenticated;
