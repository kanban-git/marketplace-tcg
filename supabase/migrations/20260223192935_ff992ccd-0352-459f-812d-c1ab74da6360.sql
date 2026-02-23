
-- Add finish column to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS finish text NOT NULL DEFAULT 'normal';

-- Convert existing language values from full names to short codes
UPDATE public.listings SET language = 'pt' WHERE language = 'Português' OR language IS NULL;
UPDATE public.listings SET language = 'en' WHERE language = 'Inglês';
UPDATE public.listings SET language = 'jp' WHERE language = 'Japonês';

-- Update default for language column
ALTER TABLE public.listings ALTER COLUMN language SET DEFAULT 'pt';
