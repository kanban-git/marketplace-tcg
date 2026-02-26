
-- 1) Drop old check constraint and add paused_minimum to allowed statuses
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_status_check 
  CHECK (status IN ('active','pending_review','pending_minimum','paused','paused_minimum','rejected','sold','cancelled'));

-- 2) Replace recalculate_user_minimum_status to handle paused_minimum
CREATE OR REPLACE FUNCTION public.recalculate_user_minimum_status(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    -- Reactivate paused_minimum listings (approved ones go active)
    UPDATE public.listings
    SET status = 'active', updated_at = now()
    WHERE seller_id = p_user_id
      AND status = 'paused_minimum'
      AND is_approved = true;
  ELSE
    -- Total < 700: pause all active listings automatically
    UPDATE public.listings
    SET status = 'paused_minimum', updated_at = now()
    WHERE seller_id = p_user_id
      AND status = 'active';

    -- Move unapproved pending_review -> pending_minimum
    UPDATE public.listings
    SET status = 'pending_minimum', updated_at = now()
    WHERE seller_id = p_user_id
      AND status = 'pending_review'
      AND is_approved = false;
  END IF;
END;
$function$;

-- 3) Update admin_approve_listing to include paused_minimum logic
CREATE OR REPLACE FUNCTION public.admin_approve_listing(p_listing_id uuid, p_admin_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_listing RECORD;
  v_total integer;
  v_new_status text;
BEGIN
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  -- Calculate effective value excluding this listing
  SELECT COALESCE(SUM(price_cents), 0) INTO v_total
  FROM public.listings
  WHERE seller_id = v_listing.seller_id
    AND status IN ('active', 'pending_review')
    AND id != p_listing_id;

  v_total := v_total + v_listing.price_cents;

  IF v_total >= 700 THEN
    v_new_status := 'active';
  ELSE
    v_new_status := 'pending_minimum';
  END IF;

  UPDATE public.listings
  SET status = v_new_status,
      is_approved = true,
      approved_at = now(),
      approved_by = p_admin_id,
      updated_at = now()
  WHERE id = p_listing_id;

  -- Recalculate all listings for this seller (handles paused_minimum too)
  PERFORM recalculate_user_minimum_status(v_listing.seller_id);

  RETURN jsonb_build_object(
    'id', p_listing_id,
    'status', v_new_status,
    'seller_id', v_listing.seller_id
  );
END;
$function$;
