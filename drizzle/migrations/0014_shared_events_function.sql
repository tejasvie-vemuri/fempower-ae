CREATE OR REPLACE FUNCTION public.get_shared_events(_other_user_id uuid)
RETURNS TABLE(event_id uuid, title text, slug text, starts_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.title, e.slug, e.starts_at
  FROM public.events e
  WHERE auth.uid() IS NOT NULL
    AND auth.uid() <> _other_user_id
    AND public.is_approved_member(auth.uid())
    AND EXISTS (SELECT 1 FROM public.registrations r WHERE r.event_id = e.id AND r.user_id = auth.uid() AND r.status = 'confirmed')
    AND EXISTS (SELECT 1 FROM public.registrations r WHERE r.event_id = e.id AND r.user_id = _other_user_id AND r.status = 'confirmed')
    AND e.starts_at < now()
  ORDER BY e.starts_at DESC
  LIMIT 10
$$;
REVOKE ALL ON FUNCTION public.get_shared_events(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_shared_events(uuid) TO authenticated;