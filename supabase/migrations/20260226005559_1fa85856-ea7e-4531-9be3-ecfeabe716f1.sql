-- Fix: convert all existing test listings to real listings
-- These were created during development and should be visible publicly
UPDATE public.listings SET is_test = false WHERE is_test = true;

-- Recreate card_market_stats view (no change needed, just ensuring it's correct)
-- The view already filters is_test = false AND status = 'active', which is correct.
-- The issue was that all listings had is_test = true.