ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS coach_save_checklists boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.coach_checklist_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_key text NOT NULL,
  checklist_label text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.coach_checklist_results TO authenticated;
GRANT ALL ON public.coach_checklist_results TO service_role;
ALTER TABLE public.coach_checklist_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own checklist results"
  ON public.coach_checklist_results FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Members save own checklist results"
  ON public.coach_checklist_results FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members delete own checklist results"
  ON public.coach_checklist_results FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_coach_checklist_results_user
  ON public.coach_checklist_results (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.coach_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback text,
  message_count integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.coach_ratings TO anon, authenticated;
GRANT SELECT ON public.coach_ratings TO authenticated;
GRANT ALL ON public.coach_ratings TO service_role;
ALTER TABLE public.coach_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can rate Zara"
  ON public.coach_ratings FOR INSERT TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR user_id = auth.uid()
  );
CREATE POLICY "Admins read Zara ratings"
  ON public.coach_ratings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));