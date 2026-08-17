CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text;
  v_looking_for text[];
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '');

  BEGIN
    SELECT COALESCE(array_agg(x), '{}')
      INTO v_looking_for
      FROM jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'looking_for', '[]'::jsonb)) AS t(x);
  EXCEPTION WHEN others THEN
    v_looking_for := '{}';
  END;

  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, v_name, NEW.email);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  INSERT INTO public.member_profiles (user_id, name, city, company, bio, linkedin_url, looking_for)
  VALUES (
    NEW.id,
    v_name,
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.raw_user_meta_data->>'company', ''),
    NULLIF(NEW.raw_user_meta_data->>'bio', ''),
    NULLIF(NEW.raw_user_meta_data->>'linkedin_url', ''),
    COALESCE(v_looking_for, '{}')
  );

  RETURN NEW;
END;
$$;