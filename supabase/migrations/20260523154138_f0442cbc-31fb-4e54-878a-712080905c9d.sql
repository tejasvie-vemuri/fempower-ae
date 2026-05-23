-- 1) Registrations: require approved member to create
DROP POLICY IF EXISTS "Users can create own registrations" ON public.registrations;
CREATE POLICY "Approved members create own registrations"
ON public.registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_approved_member(auth.uid()));

-- 2) meetup_rsvps: restrict SELECT to owner, host, and admins
DROP POLICY IF EXISTS "Approved members read rsvps" ON public.meetup_rsvps;

CREATE POLICY "Members read own rsvps"
ON public.meetup_rsvps
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Hosts read rsvps for their meetups"
ON public.meetup_rsvps
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.meetups m
  WHERE m.id = meetup_rsvps.meetup_id AND m.host_id = auth.uid()
));

CREATE POLICY "Admins read all rsvps"
ON public.meetup_rsvps
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
