
-- Remove overly permissive policies
DROP POLICY "Service role can manage sets" ON public.sets;
DROP POLICY "Service role can manage cards" ON public.cards;
DROP POLICY "Service role can manage sync_status" ON public.sync_status;
