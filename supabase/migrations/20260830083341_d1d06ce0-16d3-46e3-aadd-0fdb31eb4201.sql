-- circle_posts: members may only insert pending posts
drop policy if exists "Approved members create posts" on public.circle_posts;
create policy "Approved members create posts"
on public.circle_posts for insert to authenticated
with check (
  auth.uid() = user_id
  and is_approved_member(auth.uid())
  and not is_circle_banned(auth.uid())
  and status = 'pending'
);
create policy "Admins create posts"
on public.circle_posts for insert to authenticated
with check (has_role(auth.uid(), 'admin'::app_role));

-- member_milestones: self-inserts must be pending
drop policy if exists "Users can insert own milestones" on public.member_milestones;
create policy "Users can insert own milestones"
on public.member_milestones for insert to authenticated
with check (auth.uid() = user_id and status = 'pending');
create policy "Admins can insert milestones"
on public.member_milestones for insert to authenticated
with check (has_role(auth.uid(), 'admin'::app_role));

-- registrations: members cannot self-confirm or set payment fields
drop policy if exists "Approved members create own registrations" on public.registrations;
create policy "Approved members create own registrations"
on public.registrations for insert to authenticated
with check (
  auth.uid() = user_id
  and is_approved_member(auth.uid())
  and status = 'pending'
  and coalesce(amount_paid_cents, 0) = 0
  and payment_provider is null
  and payment_intent_id is null
);
create policy "Admins create registrations"
on public.registrations for insert to authenticated
with check (has_role(auth.uid(), 'admin'::app_role));

-- prevent members from escalating their own registration via UPDATE
drop policy if exists "Users can update own registrations" on public.registrations;
create policy "Users can update own registrations"
on public.registrations for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and status in ('pending', 'cancelled')
  and coalesce(amount_paid_cents, 0) = 0
  and payment_provider is null
  and payment_intent_id is null
);