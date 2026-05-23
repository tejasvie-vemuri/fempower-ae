-- Trusted poster flag on member profiles
ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS is_trusted_poster boolean NOT NULL DEFAULT false;

-- Helper: is the current user banned from the Circle?
CREATE TABLE IF NOT EXISTS public.circle_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  banned_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.circle_bans ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_circle_banned(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.circle_bans WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_circle_trusted(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.member_profiles WHERE user_id = _user_id AND is_trusted_poster = true);
$$;

-- Posts
CREATE TABLE IF NOT EXISTS public.circle_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_tag text NOT NULL,
  body text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending', -- pending | published | hidden | deleted
  risk_level text NOT NULL DEFAULT 'none', -- none | high
  flagged_keywords text[] NOT NULL DEFAULT '{}',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.circle_posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_circle_posts_status_published ON public.circle_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_circle_posts_topic ON public.circle_posts(topic_tag);
CREATE INDEX IF NOT EXISTS idx_circle_posts_user ON public.circle_posts(user_id);

CREATE TRIGGER trg_circle_posts_updated
BEFORE UPDATE ON public.circle_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Replies
CREATE TABLE IF NOT EXISTS public.circle_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.circle_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'published', -- published | hidden | deleted
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.circle_replies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_circle_replies_post ON public.circle_replies(post_id, created_at);

CREATE TRIGGER trg_circle_replies_updated
BEFORE UPDATE ON public.circle_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reactions
CREATE TABLE IF NOT EXISTS public.circle_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL, -- 'post' | 'reply'
  target_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(target_type, target_id, user_id, emoji)
);
ALTER TABLE public.circle_reactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_circle_reactions_target ON public.circle_reactions(target_type, target_id);

-- Reports
CREATE TABLE IF NOT EXISTS public.circle_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'open', -- open | reviewed | dismissed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.circle_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_circle_reports_status ON public.circle_reports(status, created_at DESC);

CREATE TRIGGER trg_circle_reports_updated
BEFORE UPDATE ON public.circle_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== RLS POLICIES =====

-- circle_posts
CREATE POLICY "Approved members read published posts"
ON public.circle_posts FOR SELECT TO authenticated
USING (status = 'published' AND public.is_approved_member(auth.uid()) AND NOT public.is_circle_banned(auth.uid()));

CREATE POLICY "Members read own posts"
ON public.circle_posts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all posts"
ON public.circle_posts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved members create posts"
ON public.circle_posts FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_approved_member(auth.uid())
  AND NOT public.is_circle_banned(auth.uid())
);

CREATE POLICY "Admins update posts"
ON public.circle_posts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete posts"
ON public.circle_posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- circle_replies
CREATE POLICY "Approved members read replies to published posts"
ON public.circle_replies FOR SELECT TO authenticated
USING (
  status = 'published'
  AND public.is_approved_member(auth.uid())
  AND NOT public.is_circle_banned(auth.uid())
  AND EXISTS(SELECT 1 FROM public.circle_posts p WHERE p.id = circle_replies.post_id AND p.status = 'published')
);

CREATE POLICY "Members read own replies"
ON public.circle_replies FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all replies"
ON public.circle_replies FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved members create replies"
ON public.circle_replies FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_approved_member(auth.uid())
  AND NOT public.is_circle_banned(auth.uid())
  AND EXISTS(SELECT 1 FROM public.circle_posts p WHERE p.id = post_id AND p.status = 'published')
);

CREATE POLICY "Admins update replies"
ON public.circle_replies FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete replies"
ON public.circle_replies FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- circle_reactions
CREATE POLICY "Approved members read reactions"
ON public.circle_reactions FOR SELECT TO authenticated
USING (public.is_approved_member(auth.uid()) AND NOT public.is_circle_banned(auth.uid()));

CREATE POLICY "Approved members create own reactions"
ON public.circle_reactions FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_approved_member(auth.uid())
  AND NOT public.is_circle_banned(auth.uid())
);

CREATE POLICY "Members delete own reactions"
ON public.circle_reactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- circle_reports
CREATE POLICY "Members create own reports"
ON public.circle_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id AND public.is_approved_member(auth.uid()));

CREATE POLICY "Members read own reports"
ON public.circle_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins read all reports"
ON public.circle_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update reports"
ON public.circle_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- circle_bans
CREATE POLICY "Admins manage bans"
ON public.circle_bans FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members read own ban"
ON public.circle_bans FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Public-safe view that strips identity from anonymous posts
CREATE OR REPLACE VIEW public.circle_posts_public AS
SELECT
  p.id,
  p.topic_tag,
  p.body,
  p.is_anonymous,
  p.status,
  p.published_at,
  p.created_at,
  CASE WHEN p.is_anonymous THEN NULL ELSE p.user_id END AS user_id,
  CASE WHEN p.is_anonymous THEN NULL ELSE mp.name END AS author_name,
  CASE WHEN p.is_anonymous THEN NULL ELSE mp.photo_url END AS author_photo_url
FROM public.circle_posts p
LEFT JOIN public.member_profiles mp ON mp.user_id = p.user_id
WHERE p.status = 'published';