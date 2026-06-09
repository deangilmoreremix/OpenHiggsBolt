-- VideoCo Platform Initial Schema
-- Multi-tenant video generation platform (no auth required)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  name text NOT NULL DEFAULT 'Untitled',
  description text,
  type text NOT NULL DEFAULT 'generation',
  -- 'generation', 'upload', 'clone', 'campaign'
  prompt text,
  source_video_url text,
  generated_url text,
  thumbnail_url text,
  duration float,
  status text NOT NULL DEFAULT 'processing',
  -- 'processing', 'completed', 'failed'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for tenant filtering
CREATE INDEX IF NOT EXISTS idx_videos_tenant ON videos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_videos_type ON videos(type);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);

-- Campaigns table for batch operations
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  name text NOT NULL DEFAULT 'Untitled Campaign',
  source_video_url text,
  status text NOT NULL DEFAULT 'draft',
  -- 'draft', 'processing', 'completed', 'failed'
  total_videos int DEFAULT 0,
  completed_videos int DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);

-- Storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for source files (clones, uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sources', 'sources', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Disable for no-auth access
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Allow all operations with anon key (no auth)
CREATE POLICY "Allow all for anon" ON videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON campaigns FOR ALL USING (true) WITH CHECK (true);

-- Storage policies
CREATE POLICY "Allow public read on videos" ON storage.objects
  FOR SELECT USING (bucket_id IN ('videos', 'sources'));

CREATE POLICY "Allow anon upload on videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('videos', 'sources'));

CREATE POLICY "Allow anon delete on videos" ON storage.objects
  FOR DELETE USING (bucket_id IN ('videos', 'sources'));
