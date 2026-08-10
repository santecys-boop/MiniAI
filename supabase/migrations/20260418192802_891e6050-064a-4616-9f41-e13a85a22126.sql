
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'html',
  model TEXT NOT NULL DEFAULT 'openai/gpt-5',
  published_url TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Public app (no auth) — anyone can read/insert/update their generated sites
CREATE POLICY "Anyone can view sites" ON public.sites FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sites" ON public.sites FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sites" ON public.sites FOR UPDATE USING (true);

CREATE INDEX idx_sites_created_at ON public.sites(created_at DESC);

INSERT INTO storage.buckets (id, name, public) VALUES ('published-sites', 'published-sites', true);

CREATE POLICY "Public read published sites"
  ON storage.objects FOR SELECT USING (bucket_id = 'published-sites');
CREATE POLICY "Anyone can upload published sites"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'published-sites');
CREATE POLICY "Anyone can update published sites"
  ON storage.objects FOR UPDATE USING (bucket_id = 'published-sites');
