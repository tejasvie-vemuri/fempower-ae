
-- SCHOOLS
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'school',
  emirate text,
  area text,
  curriculum text[] NOT NULL DEFAULT '{}',
  age_min int,
  age_max int,
  website_url text,
  logo_url text,
  fees_min int,
  fees_max int,
  fees_year text,
  waitlist_status text DEFAULT 'unknown',
  description text,
  source_data jsonb DEFAULT '{}'::jsonb,
  last_scraped_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published schools are viewable by everyone"
  ON public.schools FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins view all schools"
  ON public.schools FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert schools"
  ON public.schools FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update schools"
  ON public.schools FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete schools"
  ON public.schools FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_schools_status ON public.schools(status);
CREATE INDEX idx_schools_emirate ON public.schools(emirate);
CREATE INDEX idx_schools_type ON public.schools(type);

CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SCHOOL REVIEWS
CREATE TABLE public.school_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating int NOT NULL,
  body text NOT NULL,
  curriculum text,
  child_age_group text,
  waitlist_experience text,
  fees_paid_cents int,
  fees_year text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.school_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published reviews are viewable by everyone"
  ON public.school_reviews FOR SELECT
  USING (status = 'published');

CREATE POLICY "Members read own reviews"
  ON public.school_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all reviews"
  ON public.school_reviews FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved members create own reviews"
  ON public.school_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_approved_member(auth.uid())
    AND status = 'pending'
    AND rating BETWEEN 1 AND 5
    AND char_length(body) BETWEEN 10 AND 4000
  );

CREATE POLICY "Admins update reviews"
  ON public.school_reviews FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete reviews"
  ON public.school_reviews FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_school_reviews_school ON public.school_reviews(school_id);
CREATE INDEX idx_school_reviews_status ON public.school_reviews(status);
CREATE INDEX idx_school_reviews_user ON public.school_reviews(user_id);

CREATE TRIGGER school_reviews_updated_at
  BEFORE UPDATE ON public.school_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SCHOOL REQUESTS
CREATE TABLE public.school_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  website_url text,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.school_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own requests"
  ON public.school_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all requests"
  ON public.school_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved members create requests"
  ON public.school_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_approved_member(auth.uid()));

CREATE POLICY "Admins update requests"
  ON public.school_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete requests"
  ON public.school_requests FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER school_requests_updated_at
  BEFORE UPDATE ON public.school_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Aggregation function
CREATE OR REPLACE FUNCTION public.school_review_stats(_school_id uuid)
RETURNS TABLE(avg_rating numeric, review_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating), 0)::numeric, COUNT(*)::bigint
  FROM public.school_reviews
  WHERE school_id = _school_id AND status = 'published';
$$;
