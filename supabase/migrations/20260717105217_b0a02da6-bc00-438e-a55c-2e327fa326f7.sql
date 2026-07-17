
-- =========================================================
-- 1. engagement_events table
-- =========================================================
CREATE TABLE public.engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT engagement_events_event_type_check CHECK (event_type IN (
    'event_rsvp',
    'circle_post',
    'circle_reply',
    'meetup_host',
    'meetup_rsvp',
    'learn_wing_completed',
    'directory_profile_viewed',
    'whatsapp_cta_click',
    'digest_click',
    'intro_posted'
  ))
);

GRANT SELECT, INSERT ON public.engagement_events TO authenticated;
GRANT ALL ON public.engagement_events TO service_role;

ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members insert own engagement events"
  ON public.engagement_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members read own engagement events"
  ON public.engagement_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all engagement events"
  ON public.engagement_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_engagement_events_user_created
  ON public.engagement_events (user_id, created_at DESC);
CREATE INDEX idx_engagement_events_created
  ON public.engagement_events (created_at DESC);
CREATE INDEX idx_engagement_events_type_created
  ON public.engagement_events (event_type, created_at DESC);

-- =========================================================
-- 2. member_profiles: intro + digest flags
-- =========================================================
ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS intro_posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS intro_nudge_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS digest_opt_out boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_member_profiles_intro_pending
  ON public.member_profiles (approved_at)
  WHERE status = 'approved' AND intro_posted_at IS NULL;

-- =========================================================
-- 3. Trigger functions (SECURITY DEFINER, restricted)
-- =========================================================
CREATE OR REPLACE FUNCTION public.log_engagement_event_rsvp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata)
    VALUES (NEW.user_id, 'event_rsvp', NEW.event_id, jsonb_build_object('registration_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.log_engagement_circle_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata)
    VALUES (NEW.user_id, 'circle_post', NEW.id, jsonb_build_object('topic_tag', NEW.topic_tag));

    -- Intro posted?
    IF NEW.topic_tag = 'introduction' THEN
      UPDATE public.member_profiles
      SET intro_posted_at = COALESCE(intro_posted_at, now())
      WHERE user_id = NEW.user_id AND intro_posted_at IS NULL;

      INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata)
      VALUES (NEW.user_id, 'intro_posted', NEW.id, '{}'::jsonb);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.log_engagement_circle_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' THEN
    INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata)
    VALUES (NEW.user_id, 'circle_reply', NEW.post_id, jsonb_build_object('reply_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.log_engagement_meetup_host()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata)
  VALUES (NEW.host_id, 'meetup_host', NEW.id, '{}'::jsonb);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.log_engagement_meetup_rsvp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata)
  VALUES (NEW.user_id, 'meetup_rsvp', NEW.meetup_id, '{}'::jsonb);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.log_engagement_learn_wing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata)
  VALUES (NEW.user_id, 'learn_wing_completed', NEW.wing_id, '{}'::jsonb);
  RETURN NEW;
END; $$;

-- Lock the trigger helpers down (they run under trigger context only)
REVOKE ALL ON FUNCTION public.log_engagement_event_rsvp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_engagement_circle_post() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_engagement_circle_reply() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_engagement_meetup_host() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_engagement_meetup_rsvp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_engagement_learn_wing() FROM PUBLIC, anon, authenticated;

-- =========================================================
-- 4. Attach triggers
-- =========================================================
DROP TRIGGER IF EXISTS trg_engagement_registrations ON public.registrations;
CREATE TRIGGER trg_engagement_registrations
  AFTER INSERT OR UPDATE OF status ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.log_engagement_event_rsvp();

DROP TRIGGER IF EXISTS trg_engagement_circle_posts ON public.circle_posts;
CREATE TRIGGER trg_engagement_circle_posts
  AFTER INSERT OR UPDATE OF status ON public.circle_posts
  FOR EACH ROW EXECUTE FUNCTION public.log_engagement_circle_post();

DROP TRIGGER IF EXISTS trg_engagement_circle_replies ON public.circle_replies;
CREATE TRIGGER trg_engagement_circle_replies
  AFTER INSERT ON public.circle_replies
  FOR EACH ROW EXECUTE FUNCTION public.log_engagement_circle_reply();

DROP TRIGGER IF EXISTS trg_engagement_meetups ON public.meetups;
CREATE TRIGGER trg_engagement_meetups
  AFTER INSERT ON public.meetups
  FOR EACH ROW EXECUTE FUNCTION public.log_engagement_meetup_host();

DROP TRIGGER IF EXISTS trg_engagement_meetup_rsvps ON public.meetup_rsvps;
CREATE TRIGGER trg_engagement_meetup_rsvps
  AFTER INSERT ON public.meetup_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.log_engagement_meetup_rsvp();

DROP TRIGGER IF EXISTS trg_engagement_learn_progress ON public.learn_progress;
CREATE TRIGGER trg_engagement_learn_progress
  AFTER INSERT ON public.learn_progress
  FOR EACH ROW EXECUTE FUNCTION public.log_engagement_learn_wing();

-- =========================================================
-- 5. Backfill from existing tables (once)
-- =========================================================
INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata, created_at)
SELECT user_id, 'event_rsvp', event_id, jsonb_build_object('registration_id', id), created_at
FROM public.registrations WHERE status = 'confirmed'
ON CONFLICT DO NOTHING;

INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata, created_at)
SELECT user_id, 'circle_post', id, jsonb_build_object('topic_tag', topic_tag), COALESCE(published_at, created_at)
FROM public.circle_posts WHERE status = 'published'
ON CONFLICT DO NOTHING;

INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata, created_at)
SELECT user_id, 'circle_reply', post_id, jsonb_build_object('reply_id', id), created_at
FROM public.circle_replies WHERE status = 'published'
ON CONFLICT DO NOTHING;

INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata, created_at)
SELECT host_id, 'meetup_host', id, '{}'::jsonb, created_at
FROM public.meetups
ON CONFLICT DO NOTHING;

INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata, created_at)
SELECT user_id, 'meetup_rsvp', meetup_id, '{}'::jsonb, created_at
FROM public.meetup_rsvps
ON CONFLICT DO NOTHING;

INSERT INTO public.engagement_events (user_id, event_type, target_id, metadata, created_at)
SELECT user_id, 'learn_wing_completed', wing_id, '{}'::jsonb, completed_at
FROM public.learn_progress
ON CONFLICT DO NOTHING;

-- Stamp intro_posted_at for members who already have a Circle post tagged 'introduction'
UPDATE public.member_profiles mp
SET intro_posted_at = sub.first_intro
FROM (
  SELECT user_id, MIN(COALESCE(published_at, created_at)) AS first_intro
  FROM public.circle_posts
  WHERE topic_tag = 'introduction' AND status = 'published'
  GROUP BY user_id
) sub
WHERE mp.user_id = sub.user_id AND mp.intro_posted_at IS NULL;
