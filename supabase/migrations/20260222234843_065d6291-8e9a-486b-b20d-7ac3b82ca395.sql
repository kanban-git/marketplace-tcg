
-- Fix security definer view by recreating with security_invoker = true
DROP VIEW IF EXISTS public.card_market_stats;

CREATE VIEW public.card_market_stats WITH (security_invoker = true) AS
SELECT
  l.card_id,
  COUNT(*) AS offers_count,
  MIN(l.price_cents) AS min_price_cents,
  AVG(l.price_cents)::INTEGER AS avg_price_cents,
  MAX(l.created_at) AS last_offer_at
FROM public.listings l
WHERE l.status = 'active'
GROUP BY l.card_id;
