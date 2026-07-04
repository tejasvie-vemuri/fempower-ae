-- Lifestyle Manager ("Zoya") + The Pause (personal journal)

create table if not exists public.lm_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  assistant_name text not null default 'Zoya',
  preferred_name text,
  whatsapp_number text,
  city text,
  notification_prefs jsonb not null default '{"whatsapp": true, "email": false, "digest_time": "08:00"}'::jsonb,
  trial_started_at timestamptz not null default now(),
  plan_tier text not null default 'trial' check (plan_tier in ('trial','trial_expired','paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.lm_profile to authenticated;
grant all on public.lm_profile to service_role;
alter table public.lm_profile enable row level security;
create policy "Members manage own lm_profile" on public.lm_profile for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.plan_config (
  id int primary key default 1,
  trial_days int not null default 30,
  price_amount numeric not null default 29,
  price_currency text not null default 'AED',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint plan_config_single_row check (id = 1)
);
insert into public.plan_config (id) values (1) on conflict (id) do nothing;
grant select on public.plan_config to anon, authenticated;
grant update on public.plan_config to authenticated;
grant all on public.plan_config to service_role;
alter table public.plan_config enable row level security;
create policy "Anyone can read plan_config" on public.plan_config for select using (true);
create policy "Admins can update plan_config" on public.plan_config for update using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.people to authenticated;
grant all on public.people to service_role;
alter table public.people enable row level security;
create policy "Members manage own people" on public.people for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.important_dates (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  date date not null,
  recurrence text not null default 'yearly' check (recurrence in ('yearly','once')),
  reminder_lead_days int[] not null default '{5,1,0}',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.important_dates to authenticated;
grant all on public.important_dates to service_role;
alter table public.important_dates enable row level security;
create policy "Members manage own important_dates" on public.important_dates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.occasion_calendar (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  month int not null check (month between 1 and 12),
  day int check (day between 1 and 31),
  note text,
  created_at timestamptz not null default now()
);
grant select on public.occasion_calendar to anon, authenticated;
grant insert, update, delete on public.occasion_calendar to authenticated;
grant all on public.occasion_calendar to service_role;
alter table public.occasion_calendar enable row level security;
create policy "Anyone can read occasion_calendar" on public.occasion_calendar for select using (true);
create policy "Admins manage occasion_calendar" on public.occasion_calendar for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  person_id uuid references public.people(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','done','snoozed')),
  source text not null default 'manual' check (source in ('manual','chat','occasion')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.reminders to authenticated;
grant all on public.reminders to service_role;
alter table public.reminders enable row level security;
create policy "Members manage own reminders" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.restaurant_venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text,
  emirate text,
  vibe_tags text[] not null default '{}',
  cuisine text,
  google_place_id text,
  phone text,
  website text,
  created_at timestamptz not null default now()
);
grant select on public.restaurant_venues to anon, authenticated;
grant insert, update, delete on public.restaurant_venues to authenticated;
grant all on public.restaurant_venues to service_role;
alter table public.restaurant_venues enable row level security;
create policy "Anyone can read restaurant_venues" on public.restaurant_venues for select using (true);
create policy "Admins manage restaurant_venues" on public.restaurant_venues for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.places_cache (
  place_id text primary key,
  rating numeric,
  review_count int,
  photos jsonb,
  opening_hours jsonb,
  cached_at timestamptz not null default now()
);
grant select on public.places_cache to anon, authenticated;
grant all on public.places_cache to service_role;
alter table public.places_cache enable row level security;
create policy "Anyone can read places_cache" on public.places_cache for select using (true);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid references public.restaurant_venues(id) on delete set null,
  venue_name_freeform text,
  party_size int,
  requested_at timestamptz,
  occasion_note text,
  google_place_url text,
  status text not null default 'suggested' check (status in ('suggested','handed_off','self_confirmed','not_booked')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.booking_requests to authenticated;
grant all on public.booking_requests to service_role;
alter table public.booking_requests enable row level security;
create policy "Members manage own booking_requests" on public.booking_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  category text,
  is_recurring boolean not null default false,
  status text not null default 'active' check (status in ('active','ordered','archived')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.grocery_items to authenticated;
grant all on public.grocery_items to service_role;
alter table public.grocery_items enable row level security;
create policy "Members manage own grocery_items" on public.grocery_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  channel text not null default 'web' check (channel in ('web','whatsapp')),
  intent text,
  linked_entity_type text,
  linked_entity_id uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "Members manage own chat_messages" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.approval_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  related_entity_type text,
  related_entity_id uuid,
  summary text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.approval_actions to authenticated;
grant all on public.approval_actions to service_role;
alter table public.approval_actions enable row level security;
create policy "Members manage own approval_actions" on public.approval_actions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.google_calendar_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  connected_at timestamptz not null default now()
);
grant select, insert, update, delete on public.google_calendar_tokens to authenticated;
grant all on public.google_calendar_tokens to service_role;
alter table public.google_calendar_tokens enable row level security;
create policy "Members manage own google_calendar_tokens" on public.google_calendar_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  gratitude_text text,
  learning_text text,
  free_text text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.journal_entries to authenticated;
grant all on public.journal_entries to service_role;
alter table public.journal_entries enable row level security;
create policy "Members manage own journal_entries" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.journal_nudge_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_time time not null default '20:00',
  current_interval_days int not null default 1,
  consecutive_misses int not null default 0,
  last_nudge_sent_at timestamptz,
  last_entry_at timestamptz,
  enabled boolean not null default true
);
grant select, insert, update, delete on public.journal_nudge_settings to authenticated;
grant all on public.journal_nudge_settings to service_role;
alter table public.journal_nudge_settings enable row level security;
create policy "Members manage own journal_nudge_settings" on public.journal_nudge_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
