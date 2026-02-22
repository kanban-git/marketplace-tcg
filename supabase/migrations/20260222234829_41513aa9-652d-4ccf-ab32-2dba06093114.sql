
-- Create profiles table for seller info
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Vendedor',
  avatar_url TEXT,
  reputation_score NUMERIC(3,2) DEFAULT 0,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create enums as text checks via domains or just use text with constraints via triggers
-- Using text columns with validation trigger for flexibility

-- Create listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  condition TEXT NOT NULL DEFAULT 'NM' CHECK (condition IN ('NM', 'LP', 'MP', 'HP', 'Damaged')),
  language TEXT NOT NULL DEFAULT 'Português',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  city TEXT,
  state TEXT,
  shipping_type TEXT NOT NULL DEFAULT 'seller' CHECK (shipping_type IN ('seller', 'platform')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are publicly readable"
  ON public.listings FOR SELECT USING (status = 'active' OR auth.uid() = seller_id);

CREATE POLICY "Users can create own listings"
  ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own listings"
  ON public.listings FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete own listings"
  ON public.listings FOR DELETE USING (auth.uid() = seller_id);

-- Create indexes
CREATE INDEX idx_listings_card_id ON public.listings(card_id);
CREATE INDEX idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_price ON public.listings(price_cents);

-- Create card_market_stats view
CREATE VIEW public.card_market_stats AS
SELECT
  l.card_id,
  COUNT(*) AS offers_count,
  MIN(l.price_cents) AS min_price_cents,
  AVG(l.price_cents)::INTEGER AS avg_price_cents,
  MAX(l.created_at) AS last_offer_at
FROM public.listings l
WHERE l.status = 'active'
GROUP BY l.card_id;

-- Update trigger for listings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
