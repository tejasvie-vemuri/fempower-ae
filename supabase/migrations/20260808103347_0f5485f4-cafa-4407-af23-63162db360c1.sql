ALTER TABLE public.engagement_events ALTER COLUMN user_id DROP NOT NULL;

GRANT INSERT ON public.engagement_events TO anon;

CREATE POLICY "Anon can insert top-of-funnel signals"
ON public.engagement_events
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND event_type IN ('whatsapp_cta_click', 'digest_click')
);