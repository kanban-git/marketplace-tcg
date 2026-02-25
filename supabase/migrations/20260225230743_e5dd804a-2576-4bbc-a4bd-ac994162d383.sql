
-- Add fee columns and notes to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS fee_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;

-- Index for seller dashboard queries
CREATE INDEX IF NOT EXISTS idx_listings_seller_status ON public.listings (seller_id, status);
