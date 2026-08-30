create policy "Event covers are publicly readable" on storage.objects for select to anon, authenticated using (bucket_id = 'event-covers');

create policy "Admins can upload event covers" on storage.objects for insert to authenticated with check (bucket_id = 'event-covers' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update event covers" on storage.objects for update to authenticated using (bucket_id = 'event-covers' and public.has_role(auth.uid(), 'admin')) with check (bucket_id = 'event-covers' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete event covers" on storage.objects for delete to authenticated using (bucket_id = 'event-covers' and public.has_role(auth.uid(), 'admin'));