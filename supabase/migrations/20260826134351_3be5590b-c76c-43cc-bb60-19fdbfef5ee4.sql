ALTER TABLE public.engagement_events DROP CONSTRAINT IF EXISTS engagement_events_event_type_check;
ALTER TABLE public.engagement_events ADD CONSTRAINT engagement_events_event_type_check CHECK (event_type = ANY (ARRAY['event_rsvp','circle_post','circle_reply','meetup_host','meetup_rsvp','learn_wing_completed','directory_profile_viewed','whatsapp_cta_click','digest_click','intro_posted','zara_checklist_started','zara_share_click']));

DROP POLICY IF EXISTS "Anon can insert top-of-funnel signals" ON public.engagement_events;
CREATE POLICY "Anon can insert top-of-funnel signals"
ON public.engagement_events FOR INSERT TO anon
WITH CHECK (user_id IS NULL AND event_type = ANY (ARRAY['whatsapp_cta_click','digest_click','zara_checklist_started','zara_share_click']));