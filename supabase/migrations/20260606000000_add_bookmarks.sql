-- Bookmarks: members save circle posts or resources for later
create table if not exists public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_type   text not null check (item_type in ('circle_post', 'resource')),
  item_id     text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

alter table public.bookmarks enable row level security;

create policy "Members read own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Members insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Members delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);
