
ALTER TABLE public.event_photos
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS alt_text TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_photos_event_hash
  ON public.event_photos(event_id, file_hash)
  WHERE file_hash IS NOT NULL;
