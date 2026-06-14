ALTER TABLE public.member_profiles
ADD COLUMN IF NOT EXISTS profile_completion_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_member_profiles_completion_reminder
ON public.member_profiles (approved_at)
WHERE status = 'approved' AND profile_completion_email_sent_at IS NULL;