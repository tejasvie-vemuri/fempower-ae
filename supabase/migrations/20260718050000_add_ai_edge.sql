-- Your AI Edge: an admin-curated, member-only prompt library.
-- Standalone by design: not linked to Learn, the Lifestyle Manager, or Zoya.
-- Prompts are grouped into subfolders (categories); members browse published
-- prompts, copy them, and bookmark the ones they want to return to.

-- ── Subfolders ───────────────────────────────────────────────────────────────
CREATE TABLE public.ai_edge_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,                       -- emoji shown on the subfolder card
  order_index  INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Prompts ──────────────────────────────────────────────────────────────────
CREATE TABLE public.ai_edge_prompts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID NOT NULL REFERENCES public.ai_edge_categories(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  prompt_text  TEXT NOT NULL,              -- rendered in a copyable code block
  source       TEXT,                       -- free-text credit, always shown when present
  source_url   TEXT,                       -- optional; turns the source into a link
  icon         TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Per-member bookmarks ─────────────────────────────────────────────────────
CREATE TABLE public.ai_edge_bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id   UUID NOT NULL REFERENCES public.ai_edge_prompts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, prompt_id)
);

CREATE INDEX idx_ai_edge_categories_order ON public.ai_edge_categories (order_index);
CREATE INDEX idx_ai_edge_prompts_category ON public.ai_edge_prompts (category_id, order_index);
CREATE INDEX idx_ai_edge_bookmarks_user   ON public.ai_edge_bookmarks (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_edge_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_edge_prompts     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_edge_bookmarks   TO authenticated;

ALTER TABLE public.ai_edge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_edge_prompts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_edge_bookmarks   ENABLE ROW LEVEL SECURITY;

-- Categories: members (authenticated) see only published ones; admins see all.
CREATE POLICY "Published categories viewable by authenticated users"
  ON public.ai_edge_categories FOR SELECT TO authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert categories"
  ON public.ai_edge_categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories"
  ON public.ai_edge_categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories"
  ON public.ai_edge_categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Prompts: same visibility rule as categories.
CREATE POLICY "Published prompts viewable by authenticated users"
  ON public.ai_edge_prompts FOR SELECT TO authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert prompts"
  ON public.ai_edge_prompts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update prompts"
  ON public.ai_edge_prompts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete prompts"
  ON public.ai_edge_prompts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Bookmarks: each member sees and manages only her own.
CREATE POLICY "Members can view own bookmarks"
  ON public.ai_edge_bookmarks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Members can add own bookmarks"
  ON public.ai_edge_bookmarks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can remove own bookmarks"
  ON public.ai_edge_bookmarks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
