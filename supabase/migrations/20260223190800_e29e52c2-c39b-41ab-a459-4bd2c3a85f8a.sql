
-- Function to check if email exists in auth.users (security definer, no auth.users exposure)
CREATE OR REPLACE FUNCTION public.check_email_exists(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(trim(_email))
  );
$$;
