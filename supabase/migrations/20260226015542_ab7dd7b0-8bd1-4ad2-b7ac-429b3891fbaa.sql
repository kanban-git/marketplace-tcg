-- Add account_type, full_name, document columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'individual';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document text;

-- Add unique constraint on document to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS profiles_document_unique ON public.profiles (document) WHERE document IS NOT NULL;

-- Update the handle_new_user function to accept new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, full_name, document, phone, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Vendedor'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'document',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;

-- Update edit_listing function to use dynamic fee based on account_type
CREATE OR REPLACE FUNCTION public.edit_listing(p_listing_id uuid, p_user_id uuid, p_price_cents integer, p_condition text, p_language text, p_finish text, p_quantity integer, p_notes text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_fee_rate numeric;
  v_fee integer;
  v_net integer;
  v_account_type text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_listing FROM public.listings
  WHERE id = p_listing_id AND seller_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  -- Get seller account_type for fee calculation
  SELECT COALESCE(account_type, 'individual') INTO v_account_type
  FROM public.profiles WHERE id = p_user_id;

  -- PF (individual) = 5%, CNPJ (business) = 2%
  v_fee_rate := CASE WHEN v_account_type = 'business' THEN 0.02 ELSE 0.05 END;
  v_fee := ROUND(p_price_cents * v_fee_rate);
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