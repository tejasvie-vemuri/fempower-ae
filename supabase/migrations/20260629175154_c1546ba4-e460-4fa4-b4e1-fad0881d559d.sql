CREATE OR REPLACE FUNCTION public.is_approved_member(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.member_profiles
    WHERE user_id = _user_id
      AND status IN ('approved', 'hidden')
  );
$function$;