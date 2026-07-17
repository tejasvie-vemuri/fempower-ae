CREATE TABLE public.spotlight_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by      UUID NOT NULL REFERENCES auth.users(id),
  personal_note     TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'published', 'declined')),
  headline          TEXT,
  the_before        TEXT,
  the_turning_point TEXT,
  the_now           TEXT,
  advice            TEXT,
  shoutout          TEXT,
  photo_url         TEXT,
  consent_social    BOOLEAN NOT NULL DEFAULT false,
  submitted_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  spotlight_id      UUID REFERENCES public.member_spotlights(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT spotlight_requests_consent_before_submit CHECK (status = 'pending' OR consent_social = true)
);

CREATE INDEX idx_spotlight_requests_user ON public.spotlight_requests (user_id);
CREATE INDEX idx_spotlight_requests_status ON public.spotlight_requests (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spotlight_requests TO authenticated;
GRANT ALL ON public.spotlight_requests TO service_role;

ALTER TABLE public.spotlight_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own spotlight requests"
  ON public.spotlight_requests FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can submit own pending spotlight request"
  ON public.spotlight_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'submitted');

CREATE POLICY "Admins can insert spotlight requests"
  ON public.spotlight_requests FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND requested_by = auth.uid());

CREATE POLICY "Admins can update spotlight requests"
  ON public.spotlight_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete spotlight requests"
  ON public.spotlight_requests FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.member_spotlights
  ADD COLUMN headline          TEXT,
  ADD COLUMN the_before        TEXT,
  ADD COLUMN the_turning_point TEXT,
  ADD COLUMN the_now           TEXT,
  ADD COLUMN advice            TEXT,
  ADD COLUMN shoutout          TEXT,
  ADD COLUMN photo_url         TEXT,
  ADD COLUMN consent_social    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN request_id        UUID REFERENCES public.spotlight_requests(id) ON DELETE SET NULL;
