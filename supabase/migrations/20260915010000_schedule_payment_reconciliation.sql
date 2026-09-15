-- Schedule the payment reconciliation backstop (fixes the "paid but stuck on
-- pending" case). Runs every 10 minutes and confirms any stale pending Ziina
-- registration that Ziina reports as completed.
--
-- Prerequisites (configure once in the Supabase dashboard):
--   1. Edge function secret RECONCILE_CRON_SECRET (Project Settings ->
--      Edge Functions -> Secrets) — a long random string.
--   2. Vault secret `reconcile_cron_secret` (Database -> Vault) set to the SAME
--      value, so this cron job can authenticate to the function.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Idempotent: drop a previous schedule of the same name if present.
select cron.unschedule('reconcile-pending-payments')
where exists (
  select 1 from cron.job where jobname = 'reconcile-pending-payments'
);

select cron.schedule(
  'reconcile-pending-payments',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://uaiymunelgvvnznkxeik.supabase.co/functions/v1/reconcile-pending-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reconcile_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
