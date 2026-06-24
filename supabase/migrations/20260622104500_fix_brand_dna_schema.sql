-- Fix brand_dna schema mismatch for Brand Studio application

-- Update fonts to text since app stores CSV strings
alter table brand_dna alter column fonts type text using fonts::text;

-- Add missing columns to brand_dna
alter table brand_dna add column if not exists brand_name text;
alter table brand_dna add column if not exists industry text default 'General';
alter table brand_dna add column if not exists value_proposition text default '';
alter table brand_dna add column if not exists target_audience text default '';
alter table brand_dna add column if not exists tone_of_voice text default '';
alter table brand_dna add column if not exists brand_personality text default '';
alter table brand_dna add column if not exists key_messages text default '';
alter table brand_dna add column if not exists primary_colors text default '';
alter table brand_dna add column if not exists secondary_colors text default '';
alter table brand_dna add column if not exists imagery_style text default '';
alter table brand_dna add column if not exists layout_style text default '';
alter table brand_dna add column if not exists raw_json jsonb;
alter table brand_dna add column if not exists updated_at timestamptz default now();

-- Backfill brand_name for existing rows
-- (Skipped because source column naming varies by deployed schema)

