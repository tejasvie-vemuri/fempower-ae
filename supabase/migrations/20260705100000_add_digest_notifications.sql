-- Lifestyle Manager digest delivery: web push subscriptions + dedupe tracking
-- + a scheduled job that checks every 15 minutes for members whose digest
-- time has arrived. WhatsApp delivery is deliberately out of scope here,
-- email and web push only for now.

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Members manage own push_subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Prevents the same digest being sent more than once in a day.
alter table public.lm_profile
  add column if not exists last_digest_sent_date date;

-- ── Scheduled trigger ─────────────────────────────────────────────────
-- Requires a Vault secret named 'digest_cron_secret' to already exist
-- (create it once via the SQL editor before running this file, see the
-- separate snippet provided alongside this migration, never commit the
-- actual secret value to a migration file).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'lifestyle-manager-digest',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://uaiymunelgvvnznkxeik.supabase.co/functions/v1/send-lifestyle-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'digest_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
