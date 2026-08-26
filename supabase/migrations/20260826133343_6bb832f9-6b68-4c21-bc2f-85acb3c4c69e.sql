ALTER TABLE public.coach_ratings
  ADD COLUMN IF NOT EXISTS feedback_question text,
  ADD COLUMN IF NOT EXISTS transcript jsonb;