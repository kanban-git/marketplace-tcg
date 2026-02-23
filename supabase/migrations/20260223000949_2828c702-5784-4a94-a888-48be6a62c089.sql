-- Enable trigram extension first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_cards_number ON public.cards (number);
CREATE INDEX IF NOT EXISTS idx_cards_name_trgm ON public.cards USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sets_total ON public.sets (total);
CREATE INDEX IF NOT EXISTS idx_sets_release_date ON public.sets (release_date DESC);
CREATE INDEX IF NOT EXISTS idx_sets_name_trgm ON public.sets USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cards_set_id ON public.cards (set_id);