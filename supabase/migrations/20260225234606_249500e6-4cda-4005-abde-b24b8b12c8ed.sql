
-- Add 'paused' to listings_status_check if not already there
-- Add is_approved column
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_status_check 
  CHECK (status IN ('pending_minimum', 'pending_review', 'active', 'rejected', 'cancelled', 'paused', 'sold'));

-- Add is_approved boolean column (tracks whether admin has approved, independent of status)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Create DB function to recalculate user minimum status
CREATE OR REPLACE FUNCTION public.recalculate_user_minimum_status(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total integer;
BEGIN
  -- Calculate effective value: sum of price_cents for active + pending_review listings
  SELECT COALESCE(SUM(price_cents), 0) INTO v_total
  FROM public.listings
  WHERE seller_id = p_user_id
    AND status IN ('active', 'pending_review');

  IF v_total >= 700 THEN
    -- Move approved pending_minimum -> active
    UPDATE public.listings
    SET status = 'active', updated_at = now()
    WHERE seller_id = p_user_id
      AND status = 'pending_minimum'
      AND is_approved = true;

    -- Move unapproved pending_minimum -> pending_review
    UPDATE public.listings
    SET status = 'pending_review', updated_at = now()
    WHERE seller_id = p_user_id
      AND status = 'pending_minimum'
      AND is_approved = false;
  ELSE
    -- Move unapproved pending_review -> pending_minimum (only those not yet approved)
    UPDATE public.listings
    SET status = 'pending_minimum', updated_at = now()
    WHERE seller_id = p_user_id
      AND status = 'pending_review'
      AND is_approved = false;
  END IF;
END;
$$;
