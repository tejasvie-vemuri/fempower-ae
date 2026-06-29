-- Member Milestones & Spotlights

-- 1. member_milestones
CREATE TABLE public.member_milestones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category       TEXT NOT NULL CHECK (category IN ('journey', 'career', 'life', 'contribution')),
  milestone_key  TEXT NOT NULL,
  custom_text    TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  circle_post_id UUID REFERENCES public.circle_posts(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_user ON public.member_milestones (user_id);
CREATE INDEX idx_milestones_status ON public.member_milestones (status, created_at DESC);
ALTER TABLE public.member_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own milestones"
  ON public.member_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view approved milestones"
  ON public.member_milestones FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update milestones"
  ON public.member_milestones FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete milestones"
  ON public.member_milestones FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. member_spotlights
CREATE TABLE public.member_spotlights (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story        TEXT NOT NULL,
  active_from  TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_until TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_spotlights_active ON public.member_spotlights (active_from, active_until);
ALTER TABLE public.member_spotlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active spotlights"
  ON public.member_spotlights FOR SELECT
  USING (auth.uid() IS NOT NULL AND active_from <= now() AND active_until >= now());

CREATE POLICY "Admins can view all spotlights"
  ON public.member_spotlights FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert spotlights"
  ON public.member_spotlights FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update spotlights"
  ON public.member_spotlights FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete spotlights"
  ON public.member_spotlights FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
