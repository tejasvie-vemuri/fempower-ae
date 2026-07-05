-- Instagram's long-lived access token expires every ~60 days and the
-- fetch-instagram function had no way to refresh it or to survive a cold
-- start, so any transient failure (or the token simply aging out) blanked
-- the whole feed. This table gives the function durable, cross-invocation
-- storage for both the token (so it can be auto-refreshed) and the last
-- successfully fetched posts (so a failed refresh degrades to stale
-- content instead of nothing).
create table if not exists public.instagram_feed_cache (
  id                 int primary key default 1,
  access_token       text not null,
  token_expires_at   timestamptz not null,
  token_refreshed_at timestamptz not null default now(),
  posts              jsonb not null default '[]'::jsonb,
  posts_fetched_at   timestamptz,
  last_error         text,
  last_error_at      timestamptz,
  constraint instagram_feed_cache_single_row check (id = 1)
);

alter table public.instagram_feed_cache enable row level security;
-- No policies: this holds a live access token, so only the service role
-- (used exclusively by the fetch-instagram edge function) may touch it.
