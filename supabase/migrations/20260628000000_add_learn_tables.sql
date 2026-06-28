-- FemPower Learn: Courses, Modules, Wings, Resources, Progress, Reflections

-- 1. learn_courses
CREATE TABLE public.learn_courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  emoji         TEXT DEFAULT '🦋',
  display_order INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learn_courses_order ON public.learn_courses (display_order);
ALTER TABLE public.learn_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses viewable by authenticated users"
  ON public.learn_courses FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert courses"
  ON public.learn_courses FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courses"
  ON public.learn_courses FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
  ON public.learn_courses FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER learn_courses_updated_at
  BEFORE UPDATE ON public.learn_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2. learn_modules
CREATE TABLE public.learn_modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES public.learn_courses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learn_modules_course ON public.learn_modules (course_id, display_order);
ALTER TABLE public.learn_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view modules"
  ON public.learn_modules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert modules"
  ON public.learn_modules FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update modules"
  ON public.learn_modules FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete modules"
  ON public.learn_modules FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER learn_modules_updated_at
  BEFORE UPDATE ON public.learn_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3. learn_wings
CREATE TABLE public.learn_wings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id         UUID NOT NULL REFERENCES public.learn_modules(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  context_content   TEXT NOT NULL DEFAULT '',
  reflection_prompt TEXT NOT NULL DEFAULT '',
  extension_content TEXT NOT NULL DEFAULT '',
  display_order     INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 5,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learn_wings_module ON public.learn_wings (module_id, display_order);
ALTER TABLE public.learn_wings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view wings"
  ON public.learn_wings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert wings"
  ON public.learn_wings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update wings"
  ON public.learn_wings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wings"
  ON public.learn_wings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER learn_wings_updated_at
  BEFORE UPDATE ON public.learn_wings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 4. learn_resources
CREATE TABLE public.learn_resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES public.learn_courses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  url           TEXT NOT NULL,
  description   TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learn_resources_course ON public.learn_resources (course_id, display_order);
ALTER TABLE public.learn_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view resources"
  ON public.learn_resources FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert resources"
  ON public.learn_resources FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update resources"
  ON public.learn_resources FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resources"
  ON public.learn_resources FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));


-- 5. learn_progress
CREATE TABLE public.learn_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wing_id      UUID NOT NULL REFERENCES public.learn_wings(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, wing_id)
);

CREATE INDEX idx_learn_progress_user ON public.learn_progress (user_id);
ALTER TABLE public.learn_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.learn_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.learn_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.learn_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON public.learn_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));


-- 6. learn_reflections
CREATE TABLE public.learn_reflections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wing_id    UUID NOT NULL REFERENCES public.learn_wings(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  is_shared  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, wing_id)
);

CREATE INDEX idx_learn_reflections_user ON public.learn_reflections (user_id);
CREATE INDEX idx_learn_reflections_wing_shared ON public.learn_reflections (wing_id) WHERE is_shared = true;
ALTER TABLE public.learn_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reflections"
  ON public.learn_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared reflections"
  ON public.learn_reflections FOR SELECT
  USING (is_shared = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own reflections"
  ON public.learn_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections"
  ON public.learn_reflections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reflections"
  ON public.learn_reflections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reflections"
  ON public.learn_reflections FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER learn_reflections_updated_at
  BEFORE UPDATE ON public.learn_reflections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
