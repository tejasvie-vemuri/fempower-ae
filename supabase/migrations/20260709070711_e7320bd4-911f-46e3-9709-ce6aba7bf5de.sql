
-- 1. Meetups public reader (SECURITY DEFINER function, respects host_visibility)
CREATE OR REPLACE FUNCTION public.get_meetups_public()
RETURNS TABLE (
  id uuid,
  host_id uuid,
  title text,
  place text,
  emirate text,
  starts_at timestamptz,
  capacity integer,
  note text,
  host_visibility text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
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

-- 2. Meetup hosts public reader (enforces host_visibility on identity + photo)
CREATE OR REPLACE FUNCTION public.get_meetup_hosts_public()
RETURNS TABLE (
  meetup_id uuid,
  host_id uuid,
  display_name text,
  photo_url text
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
      WHEN m.host_id = auth.uid() THEN mp.photo_url
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN mp.photo_url
      WHEN m.host_visibility = 'full' THEN mp.photo_url
      ELSE NULL
    END AS photo_url
  FROM public.meetups m
  LEFT JOIN public.member_profiles mp ON mp.user_id = m.host_id
  WHERE public.is_approved_member(auth.uid());
$$;

-- 3. Circle posts public reader (unchanged semantics, just moved into a definer function)
CREATE OR REPLACE FUNCTION public.get_circle_posts_public()
RETURNS TABLE (
  id uuid,
  topic_tag text,
  body text,
  is_anonymous boolean,
  status text,
  published_at timestamptz,
  created_at timestamptz,
  user_id uuid,
  author_name text,
  author_photo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.topic_tag, p.body, p.is_anonymous, p.status, p.published_at, p.created_at,
    CASE WHEN p.is_anonymous THEN NULL ELSE p.user_id END AS user_id,
    CASE WHEN p.is_anonymous THEN NULL ELSE mp.name END AS author_name,
    CASE WHEN p.is_anonymous THEN NULL ELSE mp.photo_url END AS author_photo_url
  FROM public.circle_posts p
  LEFT JOIN public.member_profiles mp ON mp.user_id = p.user_id
  WHERE p.status = 'published'
    AND public.is_approved_member(auth.uid())
    AND NOT public.is_circle_banned(auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.get_meetups_public() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_meetup_hosts_public() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_circle_posts_public() TO authenticated, anon;

-- Recreate the three views as SECURITY INVOKER wrappers over the definer functions.
DROP VIEW IF EXISTS public.meetups_public;
CREATE VIEW public.meetups_public WITH (security_invoker = true) AS
  SELECT * FROM public.get_meetups_public();

DROP VIEW IF EXISTS public.meetup_hosts_public;
CREATE VIEW public.meetup_hosts_public WITH (security_invoker = true) AS
  SELECT * FROM public.get_meetup_hosts_public();

DROP VIEW IF EXISTS public.circle_posts_public;
CREATE VIEW public.circle_posts_public WITH (security_invoker = true) AS
  SELECT * FROM public.get_circle_posts_public();

GRANT SELECT ON public.meetups_public TO authenticated, anon;
GRANT SELECT ON public.meetup_hosts_public TO authenticated, anon;
GRANT SELECT ON public.circle_posts_public TO authenticated, anon;
