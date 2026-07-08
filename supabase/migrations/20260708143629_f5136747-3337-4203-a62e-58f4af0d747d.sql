
-- 1) CIRCLE POSTS: make view a definer (bypasses base-table RLS) and drop broad SELECT policy
DROP POLICY IF EXISTS "Approved members read published posts" ON public.circle_posts;

DROP VIEW IF EXISTS public.circle_posts_public;
CREATE VIEW public.circle_posts_public
WITH (security_invoker = off) AS
SELECT
  p.id,
  p.topic_tag,
  p.body,
  p.is_anonymous,
  p.status,
  p.published_at,
  p.created_at,
  CASE WHEN p.is_anonymous THEN NULL::uuid ELSE p.user_id END AS user_id,
  CASE WHEN p.is_anonymous THEN NULL::text ELSE mp.name END AS author_name,
  CASE WHEN p.is_anonymous THEN NULL::text ELSE mp.photo_url END AS author_photo_url
FROM public.circle_posts p
LEFT JOIN public.member_profiles mp ON mp.user_id = p.user_id
WHERE p.status = 'published'
  AND public.is_approved_member(auth.uid())
  AND NOT public.is_circle_banned(auth.uid());

GRANT SELECT ON public.circle_posts_public TO authenticated;

-- 2) MEETUPS: create sanitized view and drop broad SELECT policy on base
DROP POLICY IF EXISTS "Approved members read published meetups" ON public.meetups;

DROP VIEW IF EXISTS public.meetups_public;
CREATE VIEW public.meetups_public
WITH (security_invoker = off) AS
SELECT
  m.id,
  CASE
    WHEN m.host_id = auth.uid() THEN m.host_id
    WHEN m.host_visibility = 'full' THEN m.host_id
    ELSE NULL::uuid
  END AS host_id,
  m.title,
  m.place,
  m.emirate,
  m.starts_at,
  m.capacity,
  m.note,
  m.host_visibility,
  m.status,
  m.created_at,
  m.updated_at
FROM public.meetups m
WHERE m.status = 'published'
  AND public.is_approved_member(auth.uid());

GRANT SELECT ON public.meetups_public TO authenticated;
