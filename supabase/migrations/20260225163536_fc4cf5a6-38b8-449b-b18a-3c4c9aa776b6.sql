
-- Add printed_total column to sets
ALTER TABLE public.sets ADD COLUMN IF NOT EXISTS printed_total integer;

-- Backfill: set printed_total = total as initial fallback
-- The sync function will correct this with the official value from TCGDex
UPDATE public.sets SET printed_total = total WHERE printed_total IS NULL;
