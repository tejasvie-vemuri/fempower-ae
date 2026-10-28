ALTER TABLE public.member_profiles ADD COLUMN IF NOT EXISTS ask_me_about text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.member_profiles_tsv_trigger()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.role,'') || ' ' || coalesce(NEW.company,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.city,'') || ' ' || coalesce(NEW.industry,'')), 'B') ||
    setweight(to_tsvector('simple',
      coalesce(NEW.bio,'') || ' ' || coalesce(NEW.why_here,'') || ' ' ||
      array_to_string(NEW.expertise_tags,' ') || ' ' ||
      array_to_string(NEW.interests,' ') || ' ' ||
      array_to_string(NEW.looking_for,' ') || ' ' ||
      array_to_string(COALESCE(NEW.ask_me_about,'{}'),' ')
    ), 'C');
  RETURN NEW;
END;
$function$;

-- Badge facts for directory members. Only active members may call; returns
-- aggregate facts only (no registration details).
CREATE OR REPLACE FUNCTION public.get_member_badges(_user_ids uuid[])
RETURNS TABLE(user_id uuid, events_attended integer, spotlighted boolean, founding boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH founders AS (
    SELECT mp.user_id FROM public.member_profiles mp
    WHERE mp.status IN ('approved','hidden') AND mp.approved_at IS NOT NULL
    ORDER BY mp.approved_at ASC LIMIT 100
  )
  SELECT u.id,
    (SELECT count(DISTINCT r.event_id)::int FROM public.registrations r
       JOIN public.events e ON e.id = r.event_id
      WHERE r.user_id = u.id AND r.status = 'confirmed' AND e.starts_at < now()),
    EXISTS (SELECT 1 FROM public.member_spotlights s WHERE s.user_id = u.id),
    EXISTS (SELECT 1 FROM founders f WHERE f.user_id = u.id)
  FROM unnest(_user_ids[1:200]) AS u(id)
  WHERE public.is_approved_member(auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_member_badges(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_member_badges(uuid[]) TO authenticated;