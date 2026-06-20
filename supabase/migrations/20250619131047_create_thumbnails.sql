-- Thumbnail generations table (no auth — anonymous usage)
create table if not exists thumbnails (
  id uuid default gen_random_uuid() primary key,
  prompt text not null,
  enhanced_prompt text,
  model text not null,
  style text,
  aspect_ratio text,
  url text not null,
  quality text default 'medium',
  format text default 'png',
  width integer,
  height integer,
  is_public boolean default true,
  session_id text,
  created_at timestamptz default now()
);

-- Public index for community gallery
create index if not exists thumbnails_public_idx 
  on thumbnails(created_at desc) 
  where is_public = true;

-- Enable RLS but allow public read + anonymous insert
alter table thumbnails enable row level security;

create policy "Anyone can view public thumbnails" on thumbnails
  for select using (is_public = true);

create policy "Anyone can insert thumbnails" on thumbnails
  for insert with check (true);

create policy "Anyone can delete own thumbnail by id" on thumbnails
  for delete using (true);
