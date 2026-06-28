-- Add scheduling support to learn_courses and learn_modules

-- 1. Add published_at and 'scheduled' status to courses
ALTER TABLE public.learn_courses
  DROP CONSTRAINT IF EXISTS learn_courses_status_check;

ALTER TABLE public.learn_courses
  ADD CONSTRAINT learn_courses_status_check CHECK (status IN ('draft', 'published', 'scheduled'));

ALTER TABLE public.learn_courses
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 2. Add published_at to modules
ALTER TABLE public.learn_modules
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 3. Update course SELECT policy to include scheduled courses whose time has passed
DROP POLICY IF EXISTS "Published courses viewable by authenticated users" ON public.learn_courses;

CREATE POLICY "Published courses viewable by authenticated users"
  ON public.learn_courses FOR SELECT
  USING (
    status = 'published'
    OR (status = 'scheduled' AND published_at <= now())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Update module SELECT policy to respect published_at
DROP POLICY IF EXISTS "Authenticated users can view modules" ON public.learn_modules;

CREATE POLICY "Authenticated users can view modules"
  ON public.learn_modules FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (published_at IS NULL OR published_at <= now() OR public.has_role(auth.uid(), 'admin'))
  );
