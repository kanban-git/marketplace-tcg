
-- 1) Drop the old check constraint on listings.status
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;

-- 2) Add new check constraint with all valid statuses
ALTER TABLE public.listings ADD CONSTRAINT listings_status_check
  CHECK (status IN ('active', 'pending_minimum', 'pending_review', 'rejected', 'cancelled', 'paused', 'sold', 'removed', 'pending_activation'));

-- 3) Add approval/rejection columns to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 4) Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  entity_type text,
  entity_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 6) Migrate existing pending_activation to pending_minimum
UPDATE public.listings SET status = 'pending_minimum' WHERE status = 'pending_activation';
