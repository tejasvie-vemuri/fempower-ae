
-- Storage bucket
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

-- Public read of site-images bucket
create policy "Site images are publicly readable"
on storage.objects for select
using (bucket_id = 'site-images');

create policy "Admins can upload site images"
on storage.objects for insert
with check (bucket_id = 'site-images' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update site images"
on storage.objects for update
using (bucket_id = 'site-images' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete site images"
on storage.objects for delete
using (bucket_id = 'site-images' and public.has_role(auth.uid(), 'admin'));

-- Image metadata table
create table public.site_images (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('hero','team','event','gallery')),
  title text,
  subtitle text,
  alt text,
  link_url text,
  image_path text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_site_images_category on public.site_images(category, sort_order);

alter table public.site_images enable row level security;

create policy "Active site images are public"
on public.site_images for select
using (is_active = true);

create policy "Admins view all site images"
on public.site_images for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins insert site images"
on public.site_images for insert
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins update site images"
on public.site_images for update
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete site images"
on public.site_images for delete
using (public.has_role(auth.uid(), 'admin'));

create trigger update_site_images_updated_at
before update on public.site_images
for each row execute function public.update_updated_at_column();
