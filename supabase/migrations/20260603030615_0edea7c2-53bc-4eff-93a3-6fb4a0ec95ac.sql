-- Allow owners to delete their own coach profile
CREATE POLICY "Users can delete own profile"
  ON public.coach_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow admins to view all coach profiles (moderation/auditing)
CREATE POLICY "Admins can view all coach profiles"
  ON public.coach_profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any coach profile
CREATE POLICY "Admins can update any coach profile"
  ON public.coach_profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any coach profile
CREATE POLICY "Admins can delete any coach profile"
  ON public.coach_profiles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
