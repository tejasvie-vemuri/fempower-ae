-- Recreate view with security_invoker so RLS applies as the caller
DROP VIEW IF EXISTS public.circle_posts_public;
CREATE VIEW public.circle_posts_public
WITH (security_invoker = on) AS
SELECT
  p.id,
  p.topic_tag,
  p.body,
  p.is_anonymous,
  p.status,
  p.published_at,
  p.created_at,
  CASE WHEN p.is_anonymous THEN NULL ELSE p.user_id END AS user_id,
  CASE WHEN p.is_anonymous THEN NULL ELSE mp.name END AS author_name,
  CASE WHEN p.is_anonymous THEN NULL ELSE mp.photo_url END AS author_photo_url
FROM public.circle_posts p
LEFT JOIN public.member_profiles mp ON mp.user_id = p.user_id
WHERE p.status = 'published';

-- Lock down the new SECURITY DEFINER helpers so they're not callable from the API
REVOKE ALL ON FUNCTION public.is_circle_banned(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_circle_trusted(uuid) FROM PUBLIC, anon, authenticated;