
-- Add image_ptbr column to cards table (nullable, no breaking change)
ALTER TABLE public.cards ADD COLUMN image_ptbr text NULL;
