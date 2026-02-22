
-- Table: sets
CREATE TABLE public.sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  series TEXT,
  total INTEGER,
  release_date TEXT,
  logo TEXT,
  symbol TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sets are publicly readable" ON public.sets FOR SELECT USING (true);
CREATE POLICY "Service role can manage sets" ON public.sets FOR ALL USING (true) WITH CHECK (true);

-- Table: cards
CREATE TABLE public.cards (
  id TEXT PRIMARY KEY,
  set_id TEXT REFERENCES public.sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT,
  rarity TEXT DEFAULT 'Unknown',
  supertype TEXT,
  types TEXT[] DEFAULT '{}',
  image_small TEXT,
  image_large TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cards are publicly readable" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Service role can manage cards" ON public.cards FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_cards_set_id ON public.cards(set_id);
CREATE INDEX idx_cards_rarity ON public.cards(rarity);

-- Table: sync_status
CREATE TABLE public.sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  total_sets INTEGER DEFAULT 0,
  synced_sets INTEGER DEFAULT 0,
  total_cards INTEGER DEFAULT 0,
  synced_cards INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sync status is publicly readable" ON public.sync_status FOR SELECT USING (true);
CREATE POLICY "Service role can manage sync_status" ON public.sync_status FOR ALL USING (true) WITH CHECK (true);
