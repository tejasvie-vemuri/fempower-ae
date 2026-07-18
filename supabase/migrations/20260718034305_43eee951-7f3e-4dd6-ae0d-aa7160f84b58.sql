
ALTER TABLE public.spotlight_requests
  ADD COLUMN IF NOT EXISTS role_company        TEXT,
  ADD COLUMN IF NOT EXISTS identity_tag        TEXT,
  ADD COLUMN IF NOT EXISTS stopped_waiting_for TEXT,
  ADD COLUMN IF NOT EXISTS pull_quote          TEXT,
  ADD COLUMN IF NOT EXISTS rally_line          TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_consent    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linkedin_url        TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_posted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linkedin_caption    TEXT;

ALTER TABLE public.member_spotlights
  ADD COLUMN IF NOT EXISTS role_company        TEXT,
  ADD COLUMN IF NOT EXISTS identity_tag        TEXT,
  ADD COLUMN IF NOT EXISTS stopped_waiting_for TEXT,
  ADD COLUMN IF NOT EXISTS pull_quote          TEXT,
  ADD COLUMN IF NOT EXISTS rally_line          TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_consent    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linkedin_url        TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_posted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linkedin_caption    TEXT;
