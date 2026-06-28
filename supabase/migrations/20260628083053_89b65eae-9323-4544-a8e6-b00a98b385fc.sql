ALTER TABLE public.learn_wings
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_learn_wings_featured
  ON public.learn_wings (featured_until)
  WHERE featured_until IS NOT NULL;