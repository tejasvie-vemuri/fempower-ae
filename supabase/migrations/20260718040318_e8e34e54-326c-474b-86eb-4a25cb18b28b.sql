ALTER TABLE public.spotlight_requests
  ADD COLUMN IF NOT EXISTS linkedin_post_attempts jsonb NOT NULL DEFAULT '[]'::jsonb;