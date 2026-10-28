CREATE TABLE public.member_badge_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  awarded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_key)
);
GRANT SELECT, INSERT, DELETE ON public.member_badge_awards TO authenticated;
GRANT ALL ON public.member_badge_awards TO service_role;
ALTER TABLE public.member_badge_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage badge awards" ON public.member_badge_awards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.get_member_badges(uuid[]);
CREATE FUNCTION public.get_member_badges(_user_ids uuid[])
RETURNS TABLE(user_id uuid, events_attended integer, spotlighted boolean, circle_contributions integer, meetups_hosted integer, wings_completed integer, story_shared boolean, manual_badges text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT u.id,
    (SELECT count(DISTINCT r.event_id)::int FROM public.registrations r
       JOIN public.events e ON e.id = r.event_id
      WHERE r.user_id = u.id AND r.status = 'confirmed' AND e.starts_at < now()),
    EXISTS (SELECT 1 FROM public.member_spotlights s WHERE s.user_id = u.id),
    ((SELECT count(*) FROM public.circle_posts p WHERE p.user_id = u.id AND p.status = 'published' AND NOT p.is_anonymous)
     + (SELECT count(*) FROM public.circle_replies c WHERE c.user_id = u.id AND c.status = 'published'))::int,
    (SELECT count(*)::int FROM public.meetups m WHERE m.host_id = u.id AND m.status = 'published' AND m.host_visibility = 'full'),
    (SELECT count(*)::int FROM public.learn_progress lp WHERE lp.user_id = u.id),
    EXISTS (SELECT 1 FROM public.member_testimonials t WHERE t.user_id = u.id AND t.status = 'approved'),
    COALESCE((SELECT array_agg(a.badge_key ORDER BY a.created_at) FROM public.member_badge_awards a WHERE a.user_id = u.id), '{}')
  FROM unnest(_user_ids[1:200]) AS u(id)
  WHERE public.is_approved_member(auth.uid()) OR public.has_role(auth.uid(), 'admin');
$$;
REVOKE ALL ON FUNCTION public.get_member_badges(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_member_badges(uuid[]) TO authenticated;