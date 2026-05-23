
-- Member directory profiles
CREATE TABLE public.member_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  role TEXT,
  company TEXT,
  city TEXT,
  bio TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  website_url TEXT,
  industry TEXT,
  expertise_tags TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}',
  looking_for TEXT[] NOT NULL DEFAULT '{}',
  why_here TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','hidden')),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  search_tsv TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for scale
CREATE INDEX idx_member_profiles_status ON public.member_profiles(status);
CREATE INDEX idx_member_profiles_industry ON public.member_profiles(industry);
CREATE INDEX idx_member_profiles_city ON public.member_profiles(city);
CREATE INDEX idx_member_profiles_search ON public.member_profiles USING GIN(search_tsv);
CREATE INDEX idx_member_profiles_expertise ON public.member_profiles USING GIN(expertise_tags);
CREATE INDEX idx_member_profiles_looking ON public.member_profiles USING GIN(looking_for);

-- Maintain tsvector
CREATE OR REPLACE FUNCTION public.member_profiles_tsv_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.role,'') || ' ' || coalesce(NEW.company,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.city,'') || ' ' || coalesce(NEW.industry,'')), 'B') ||
    setweight(to_tsvector('simple',
      coalesce(NEW.bio,'') || ' ' || coalesce(NEW.why_here,'') || ' ' ||
      array_to_string(NEW.expertise_tags,' ') || ' ' ||
      array_to_string(NEW.interests,' ') || ' ' ||
      array_to_string(NEW.looking_for,' ')
    ), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_member_profiles_tsv
BEFORE INSERT OR UPDATE ON public.member_profiles
FOR EACH ROW EXECUTE FUNCTION public.member_profiles_tsv_trigger();

CREATE TRIGGER trg_member_profiles_updated_at
BEFORE UPDATE ON public.member_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own profile"
ON public.member_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Signed-in members view approved profiles"
ON public.member_profiles FOR SELECT
TO authenticated
USING (status = 'approved');

CREATE POLICY "Admins view all profiles"
ON public.member_profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Members insert own profile"
ON public.member_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members update own profile"
ON public.member_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins update any profile"
ON public.member_profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete profiles"
ON public.member_profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Extend handle_new_user to seed a pending member profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  INSERT INTO public.member_profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''));

  RETURN NEW;
END;
$$;

-- Backfill member_profiles for existing users
INSERT INTO public.member_profiles (user_id, name)
SELECT p.user_id, COALESCE(p.name, '')
FROM public.profiles p
LEFT JOIN public.member_profiles mp ON mp.user_id = p.user_id
WHERE mp.id IS NULL;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Member photos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-photos');

CREATE POLICY "Members upload own photo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'member-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Members update own photo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'member-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Members delete own photo"
ON storage.objects FOR DELETE
USING (bucket_id = 'member-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
