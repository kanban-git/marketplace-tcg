
-- Banners table
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  subtitle text,
  cta_text text,
  cta_url text,
  link_url text,
  media_desktop_url text NOT NULL,
  media_tablet_url text,
  media_mobile_url text,
  "order" integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public can read active banners
CREATE POLICY "Active banners are publicly readable"
  ON public.banners FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR now() >= starts_at)
    AND (ends_at IS NULL OR now() <= ends_at)
  );

-- Admins full access
CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Public storage bucket for banner media
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for banners bucket
CREATE POLICY "Anyone can read banner files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banner files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update banner files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banner files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'::app_role));
