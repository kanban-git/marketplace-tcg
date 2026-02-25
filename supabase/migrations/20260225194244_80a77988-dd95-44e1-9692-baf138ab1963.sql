
-- Indexes for marketplace performance
CREATE INDEX IF NOT EXISTS idx_listings_card_status_price ON public.listings (card_id, status, price_cents);
CREATE INDEX IF NOT EXISTS idx_analytics_event_entity_created ON public.analytics_events (event_name, entity_id, created_at);
