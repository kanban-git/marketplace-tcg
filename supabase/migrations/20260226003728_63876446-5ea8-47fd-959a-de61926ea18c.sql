
-- 1) Migrate any paused/paused_minimum listings back to pending_minimum
UPDATE public.listings SET status = 'pending_minimum' WHERE status IN ('paused', 'paused_minimum', 'paused_user');

-- 2) Update status constraint to only allow valid statuses
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_status_check
  CHECK (status IN ('pending_review', 'active', 'pending_minimum', 'rejected', 'sold', 'cancelled'));

-- 3) Simplify recalculate_minimum_visibility
CREATE OR REPLACE FUNCTION public.recalculate_minimum_visibility(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_active integer;
  v_affected jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(SUM(price_cents), 0) INTO v_total_active
  FROM public.listings
  WHERE seller_id = p_user_id AND status = 'active';

  IF v_total_active < 700 THEN
    WITH moved AS (
      UPDATE public.listings
      SET status = 'pending_minimum', updated_at = now()
      WHERE seller_id = p_user_id AND status = 'active'
      RETURNING *
    )
    SELECT COALESCE(jsonb_agg(to_jsonb(moved)), '[]'::jsonb) INTO v_affected FROM moved;
  ELSE
    WITH moved AS (
      UPDATE public.listings
      SET status = 'active', updated_at = now()
      WHERE seller_id = p_user_id AND status = 'pending_minimum' AND is_approved = true
      RETURNING *
    )
    SELECT COALESCE(jsonb_agg(to_jsonb(moved)), '[]'::jsonb) INTO v_affected FROM moved;
  END IF;

  SELECT COALESCE(SUM(price_cents), 0) INTO v_total_active
  FROM public.listings WHERE seller_id = p_user_id AND status = 'active';

  RETURN jsonb_build_object('total_active_value', v_total_active, 'affectedListings', v_affected);
END;
$function$;

-- 4) Simplify recalculate_user_minimum_status
CREATE OR REPLACE FUNCTION public.recalculate_user_minimum_status(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_effective integer;
BEGIN
  SELECT COALESCE(SUM(price_cents), 0) INTO v_total_effective
  FROM public.listings
  WHERE seller_id = p_user_id AND status IN ('active', 'pending_review');

  IF v_total_effective >= 700 THEN
    UPDATE public.listings SET status = 'active', updated_at = now()
    WHERE seller_id = p_user_id AND status = 'pending_minimum' AND is_approved = true;

    UPDATE public.listings SET status = 'pending_review', updated_at = now()
    WHERE seller_id = p_user_id AND status = 'pending_minimum' AND is_approved = false;
  ELSE
    UPDATE public.listings SET status = 'pending_minimum', updated_at = now()
    WHERE seller_id = p_user_id AND status = 'pending_review' AND is_approved = false;
  END IF;

  PERFORM public.recalculate_minimum_visibility(p_user_id);
END;
$function$;

-- 5) Drop toggle_listing_status
DROP FUNCTION IF EXISTS public.toggle_listing_status(uuid, text, uuid);

-- 6) Create delete_listing RPC
CREATE OR REPLACE FUNCTION public.delete_listing(p_listing_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_listing public.listings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_listing FROM public.listings
  WHERE id = p_listing_id AND seller_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  DELETE FROM public.listings WHERE id = p_listing_id AND seller_id = p_user_id;

  PERFORM public.recalculate_user_minimum_status(p_user_id);

  RETURN jsonb_build_object('deleted_id', p_listing_id, 'status', 'ok');
END;
$function$;

-- 7) Create edit_listing RPC
CREATE OR REPLACE FUNCTION public.edit_listing(
  p_listing_id uuid, p_user_id uuid,
  p_price_cents integer, p_condition text, p_language text,
  p_finish text, p_quantity integer, p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_fee integer;
  v_net integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_listing FROM public.listings
  WHERE id = p_listing_id AND seller_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  v_fee := ROUND(p_price_cents * 0.10);
  v_net := p_price_cents - v_fee;

  UPDATE public.listings SET
    price_cents = p_price_cents, fee_amount = v_fee, net_amount = v_net,
    condition = p_condition, language = p_language, finish = p_finish,
    quantity = p_quantity, notes = p_notes,
    status = 'pending_review', is_approved = false, updated_at = now()
  WHERE id = p_listing_id AND seller_id = p_user_id;

  PERFORM public.recalculate_user_minimum_status(p_user_id);

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;

  RETURN to_jsonb(v_listing);
END;
$function$;
