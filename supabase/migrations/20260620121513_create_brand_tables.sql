-- Brand DNA table

create table if not exists brand_dna (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  name text,
  tagline text,
  description text,
  tone text[],
  personality text[],
  messages text[],
  primary_color text default '#000000',
  secondary_color text default '#ffffff',
  accent_color text default '#0066cc',
  fonts jsonb default '[]',
  logo_url text,
  screenshot_url text,
  raw_colors text[],
  created_at timestamptz default now()
);

-- Campaigns table

create table if not exists brand_campaigns (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references brand_dna(id) on delete cascade,
  goal text not null,
  direction text,
  concepts jsonb default '[]',
  created_at timestamptz default now()
);

-- Assets table

create table if not exists brand_assets (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references brand_campaigns(id) on delete cascade,
  brand_id uuid references brand_dna(id) on delete cascade,
  platform text not null,
  concept_index integer default 0,
  headline text,
  body text,
  cta text,
  image_url text,
  canvas_data jsonb,
  created_at timestamptz default now()
);

-- Photo Studio shoots table

create table if not exists brand_photoshoots (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references brand_dna(id) on delete cascade,
  style text not null,
  category text not null,
  product_url text,
  image_url text,
  created_at timestamptz default now()
);

-- Animations table

create table if not exists brand_animations (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references brand_dna(id) on delete cascade,
  source_url text not null,
  video_url text,
  resolution text default '720p',
  duration integer default 5,
  created_at timestamptz default now()
);

-- RLS: public access (no auth)

alter table brand_dna enable row level security;
alter table brand_campaigns enable row level security;
alter table brand_assets enable row level security;
alter table brand_photoshoots enable row level security;
alter table brand_animations enable row level security;

drop policy if exists "public all brand_dna" on brand_dna;
drop policy if exists "public all brand_campaigns" on brand_campaigns;
drop policy if exists "public all brand_assets" on brand_assets;
drop policy if exists "public all brand_photoshoots" on brand_photoshoots;
drop policy if exists "public all brand_animations" on brand_animations;

create policy "public all brand_dna" on brand_dna for all using (true) with check (true);
create policy "public all brand_campaigns" on brand_campaigns for all using (true) with check (true);
create policy "public all brand_assets" on brand_assets for all using (true) with check (true);
create policy "public all brand_photoshoots" on brand_photoshoots for all using (true) with check (true);
create policy "public all brand_animations" on brand_animations for all using (true) with check (true);
