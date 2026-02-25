
-- Create product_items table
CREATE TABLE public.product_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'product',
  brand text,
  description text,
  image text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.product_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product items are publicly readable"
  ON public.product_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product items"
  ON public.product_items FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add entity columns to listings (backward compatible)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS entity_type text NOT NULL DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS entity_id text;

-- Backfill entity_id from card_id for existing rows
UPDATE public.listings SET entity_id = card_id WHERE entity_id IS NULL;

-- Index for filtering by entity_type
CREATE INDEX IF NOT EXISTS idx_listings_entity_type ON public.listings(entity_type, status);
