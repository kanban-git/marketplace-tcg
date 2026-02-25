
-- 1) Add is_test to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- 2) Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT 'false'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "App settings are publicly readable"
  ON public.app_settings FOR SELECT
  USING (true);

-- Admin manage
CREATE POLICY "Admins can manage app settings"
  ON public.app_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed analytics_paused
INSERT INTO public.app_settings (key, value) VALUES ('analytics_paused', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3) Update card_market_stats view to exclude test listings
CREATE OR REPLACE VIEW public.card_market_stats AS
SELECT
  card_id,
  count(*) AS offers_count,
  min(price_cents) AS min_price_cents,
  avg(price_cents)::integer AS avg_price_cents,
  max(created_at) AS last_offer_at
FROM public.listings
WHERE status = 'active' AND is_test = false
GROUP BY card_id;

-- 4) Update RLS on listings to hide test listings from public
DROP POLICY IF EXISTS "Active listings are publicly readable" ON public.listings;
CREATE POLICY "Active listings are publicly readable"
  ON public.listings FOR SELECT
  USING (
    (status = 'active' AND is_test = false)
    OR (auth.uid() = seller_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );
