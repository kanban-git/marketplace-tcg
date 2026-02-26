-- Atomic minimum-visibility recalculation (active-only rule)
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
  WHERE seller_id = p_user_id
    AND status = 'active';

  IF v_total_active < 700 THEN
    WITH moved AS (
      UPDATE public.listings
      SET status = 'paused_minimum', updated_at = now()
      WHERE seller_id = p_user_id
        AND status = 'active'
      RETURNING *
    )
    SELECT COALESCE(jsonb_agg(to_jsonb(moved)), '[]'::jsonb) INTO v_affected FROM moved;
  ELSE
    WITH moved AS (
      UPDATE public.listings
      SET status = 'active', updated_at = now()
      WHERE seller_id = p_user_id
        AND status = 'paused_minimum'
        AND is_approved = true
      RETURNING *
    )
    SELECT COALESCE(jsonb_agg(to_jsonb(moved)), '[]'::jsonb) INTO v_affected FROM moved;
  END IF;

  SELECT COALESCE(SUM(price_cents), 0) INTO v_total_active
  FROM public.listings
  WHERE seller_id = p_user_id
    AND status = 'active';

  RETURN jsonb_build_object(
    'total_active_value', v_total_active,
    'affectedListings', v_affected
  );
END;
$function$;

-- Keep pending_minimum/pending_review engine and delegate active visibility to recalculate_minimum_visibility
CREATE OR REPLACE FUNCTION public.recalculate_user_minimum_status(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_effective integer;
BEGIN
  -- Effective value for approval pipeline
  SELECT COALESCE(SUM(price_cents), 0) INTO v_total_effective
  FROM public.listings
  WHERE seller_id = p_user_id
    AND status IN ('active', 'pending_review');

  IF v_total_effective >= 700 THEN
    UPDATE public.listings
    SET status = 'active', updated_at = now()
    WHERE seller_id = p_user_id
      AND status = 'pending_minimum'
      AND is_approved = true;

    UPDATE public.listings
    SET status = 'pending_review', updated_at = now()
    WHERE seller_id = p_user_id
      AND status = 'pending_minimum'
      AND is_approved = false;
  ELSE
    UPDATE public.listings
    SET status = 'pending_minimum', updated_at = now()
    WHERE seller_id = p_user_id
      AND status = 'pending_review'
      AND is_approved = false;
  END IF;

  PERFORM public.recalculate_minimum_visibility(p_user_id);
END;
$function$;

-- Atomic endpoint-style RPC for pause/activate in one transaction
CREATE OR REPLACE FUNCTION public.toggle_listing_status(
  p_listing_id uuid,
  p_action text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_updated public.listings%ROWTYPE;
  v_next_status text;
  v_active_before_recalc uuid[] := '{}'::uuid[];
  v_affected jsonb := '[]'::jsonb;
  v_total_active integer := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
    AND seller_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF p_action = 'pause' THEN
    IF v_listing.status <> 'active' THEN
      RAISE EXCEPTION 'Listing must be active to pause';
    END IF;

    UPDATE public.listings
    SET status = 'paused', updated_at = now()
    WHERE id = p_listing_id;

  ELSIF p_action = 'activate' THEN
    IF v_listing.status NOT IN ('paused', 'paused_minimum') THEN
      RAISE EXCEPTION 'Listing must be paused to activate';
    END IF;

    v_next_status := CASE WHEN v_listing.is_approved THEN 'active' ELSE 'pending_review' END;

    UPDATE public.listings
    SET status = v_next_status, updated_at = now()
    WHERE id = p_listing_id;
  ELSE
    RAISE EXCEPTION 'Invalid action. Expected pause or activate';
  END IF;

  SELECT COALESCE(array_agg(id), '{}'::uuid[]) INTO v_active_before_recalc
  FROM public.listings
  WHERE seller_id = p_user_id
    AND status = 'active';

  PERFORM public.recalculate_user_minimum_status(p_user_id);

  SELECT * INTO v_updated
  FROM public.listings
  WHERE id = p_listing_id;

  SELECT COALESCE(SUM(price_cents), 0) INTO v_total_active
  FROM public.listings
  WHERE seller_id = p_user_id
    AND status = 'active';

  SELECT COALESCE(jsonb_agg(to_jsonb(l)), '[]'::jsonb) INTO v_affected
  FROM public.listings l
  WHERE l.seller_id = p_user_id
    AND l.id = ANY(v_active_before_recalc)
    AND l.status = 'paused_minimum';

  RETURN jsonb_build_object(
    'updatedListing', to_jsonb(v_updated),
    'affectedListings', v_affected,
    'total_active_value', v_total_active
  );
END;
$function$;