-- Allow admins to update listings
CREATE POLICY "Admins can update listings"
ON public.listings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RPC: approve a listing atomically
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
  -- Get listing
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  -- Calculate effective value for seller (excluding this listing if it's pending_review, since it will change)
  SELECT COALESCE(SUM(price_cents), 0) INTO v_total
  FROM public.listings
  WHERE seller_id = v_listing.seller_id
    AND status IN ('active', 'pending_review')
    AND id != p_listing_id;

  -- Add this listing's price to total (it's being approved)
  v_total := v_total + v_listing.price_cents;

  IF v_total >= 700 THEN
    v_new_status := 'active';
  ELSE
    v_new_status := 'pending_minimum';
  END IF;

  -- Update the listing
  UPDATE public.listings
  SET status = v_new_status,
      is_approved = true,
      approved_at = now(),
      approved_by = p_admin_id,
      updated_at = now()
  WHERE id = p_listing_id;

  -- Recalculate all other listings for this seller
  PERFORM recalculate_user_minimum_status(v_listing.seller_id);

  RETURN jsonb_build_object(
    'id', p_listing_id,
    'status', v_new_status,
    'seller_id', v_listing.seller_id
  );
END;
$function$;

-- RPC: reject a listing atomically
CREATE OR REPLACE FUNCTION public.admin_reject_listing(p_listing_id uuid, p_admin_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_listing RECORD;
BEGIN
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  UPDATE public.listings
  SET status = 'rejected',
      is_approved = false,
      rejected_at = now(),
      rejected_by = p_admin_id,
      rejection_reason = p_reason,
      updated_at = now()
  WHERE id = p_listing_id;

  RETURN jsonb_build_object(
    'id', p_listing_id,
    'status', 'rejected',
    'seller_id', v_listing.seller_id
  );
END;
$function$;