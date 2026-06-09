-- VideoCo Platform Schema Extensions
-- Adds tables for: leads, feedback, analytics events, brand kit, ai_videos, embed tracking

-- Leads / Form submissions table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  form_name text DEFAULT 'Contact Form',
  name text,
  email text,
  message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_video ON leads(video_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- Feedback / Survey submissions
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  question text,
  answer text,
  user_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_tenant ON feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_video ON feedback(video_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- Analytics events (play, view, click tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'play', 'view', 'click', 'embed_view', 'cta_click', 'form_submit'
  visitor_id text,
  session_id text,
  referrer text,
  user_agent text,
  ip_hash text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_video ON analytics_events(video_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);

-- Brand kit (per tenant)
CREATE TABLE IF NOT EXISTS brand_kit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default' UNIQUE,
  primary_color text DEFAULT '#22d3ee',
  secondary_color text DEFAULT '#a855f7',
  primary_text_color text DEFAULT '#ffffff',
  secondary_text_color text DEFAULT '#a1a1aa',
  cta_text text DEFAULT 'Learn More',
  logo_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_kit_tenant ON brand_kit(tenant_id);

-- AI Videos table (from the ai-videos page)
CREATE TABLE IF NOT EXISTS ai_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  og_video_id text,
  contact_name text,
  contact_email text,
  generated_url text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'processing',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_videos_tenant ON ai_videos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_videos_video ON ai_videos(video_id);

-- Embed tracking
CREATE TABLE IF NOT EXISTS embed_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text,
  description text,
  cta_text text DEFAULT 'Learn More',
  cta_url text,
  cta_secondary_text text,
  cta_secondary_url text,
  password_hash text,
  views_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embed_video ON embed_pages(video_id);
CREATE INDEX IF NOT EXISTS idx_embed_slug ON embed_pages(slug);

-- RLS: Disable for no-auth access
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kit ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON analytics_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON brand_kit FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON ai_videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON embed_pages FOR ALL USING (true) WITH CHECK (true);

-- Insert default brand kit
INSERT INTO brand_kit (tenant_id) VALUES ('default') ON CONFLICT DO NOTHING;
