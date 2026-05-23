CREATE TABLE IF NOT EXISTS public.meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  title text NOT NULL,
  place text NOT NULL,
  emirate text,
  starts_at timestamptz NOT NULL,
  capacity int,
  note text,
  host_visibility text NOT NULL DEFAULT 'full', -- 'full' | 'first_name'
  status text NOT NULL DEFAULT 'published', -- published | cancelled | hidden
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_meetups_starts_at ON public.meetups(starts_at);
CREATE INDEX IF NOT EXISTS idx_meetups_status ON public.meetups(status);
CREATE INDEX IF NOT EXISTS idx_meetups_host ON public.meetups(host_id);

CREATE TRIGGER trg_meetups_updated BEFORE UPDATE ON public.meetups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.meetup_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid NOT NULL REFERENCES public.meetups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meetup_id, user_id)
);
ALTER TABLE public.meetup_rsvps ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_meetup_rsvps_meetup ON public.meetup_rsvps(meetup_id);
CREATE INDEX IF NOT EXISTS idx_meetup_rsvps_user ON public.meetup_rsvps(user_id);

CREATE TABLE IF NOT EXISTS public.meetup_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid NOT NULL REFERENCES public.meetups(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meetup_reports ENABLE ROW LEVEL SECURITY;

-- meetups policies
CREATE POLICY "Approved members read published meetups"
ON public.meetups FOR SELECT TO authenticated
USING (status = 'published' AND public.is_approved_member(auth.uid()));

CREATE POLICY "Hosts read own meetups"
ON public.meetups FOR SELECT TO authenticated
USING (auth.uid() = host_id);

CREATE POLICY "Admins read all meetups"
ON public.meetups FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved members create meetups"
ON public.meetups FOR INSERT TO authenticated
WITH CHECK (auth.uid() = host_id AND public.is_approved_member(auth.uid()));

CREATE POLICY "Hosts update own meetups"
ON public.meetups FOR UPDATE TO authenticated
USING (auth.uid() = host_id);

CREATE POLICY "Admins update meetups"
ON public.meetups FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hosts delete own meetups"
ON public.meetups FOR DELETE TO authenticated
USING (auth.uid() = host_id);

CREATE POLICY "Admins delete meetups"
ON public.meetups FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- rsvp policies
CREATE POLICY "Approved members read rsvps"
ON public.meetup_rsvps FOR SELECT TO authenticated
USING (public.is_approved_member(auth.uid()));

CREATE POLICY "Approved members rsvp self"
ON public.meetup_rsvps FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_approved_member(auth.uid())
  AND EXISTS(SELECT 1 FROM public.meetups m WHERE m.id = meetup_id AND m.status = 'published')
);

CREATE POLICY "Members remove own rsvp"
ON public.meetup_rsvps FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins delete rsvps"
ON public.meetup_rsvps FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- reports policies
CREATE POLICY "Approved members create meetup reports"
ON public.meetup_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id AND public.is_approved_member(auth.uid()));

CREATE POLICY "Members read own meetup reports"
ON public.meetup_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins read all meetup reports"
ON public.meetup_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update meetup reports"
ON public.meetup_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));