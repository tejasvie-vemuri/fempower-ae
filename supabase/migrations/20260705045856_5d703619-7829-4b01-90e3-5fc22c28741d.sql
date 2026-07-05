
CREATE OR REPLACE VIEW public.meetup_hosts_public
WITH (security_invoker = true) AS
SELECT
  m.id AS meetup_id,
  m.host_id,
  CASE
    WHEN mp.name IS NULL THEN NULL
    WHEN m.host_visibility = 'first_name' THEN split_part(mp.name, ' ', 1)
    ELSE mp.name
  END AS display_name,
  mp.photo_url
FROM public.meetups m
LEFT JOIN public.member_profiles mp ON mp.user_id = m.host_id;

GRANT SELECT ON public.meetup_hosts_public TO authenticated;
