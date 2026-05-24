GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_circle_banned(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_circle_trusted(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.school_review_stats(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.event_confirmed_count(uuid) TO anon, authenticated;