-- PR #2: Source upload + asset model + Creative Analysis V1
--
-- Creates the minimal persistence needed for the manual-only workflow:
-- upload an original source image, manually mark candidate regions on it,
-- review them, and create an extraction record from a reviewed region.
--
-- No automated analysis exists yet — `creative_analyses.provider` and
-- `candidate_regions.created_by` are constrained to 'manual' until a real
-- automated provider is implemented (PR #5). `extractions.status` stays at
-- 'PENDING' in this PR: no crop/processing pipeline is implemented yet, so
-- no derived image file is ever fabricated (see docs/PRODUCT_ARCHITECTURE.md
-- truth rules).

create extension if not exists pgcrypto;

-- garment_sources ------------------------------------------------------
-- The original uploaded source image. Immutable: no UPDATE policy exists,
-- and there is no DELETE policy either, so once persisted a source and its
-- storage object cannot be changed or removed by any client role.

create table garment_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  storage_bucket text not null default 'garment-sources',
  storage_path text not null,
  byte_size bigint not null check (byte_size > 0),
  width_px integer check (width_px is null or width_px > 0),
  height_px integer check (height_px is null or height_px > 0),
  created_at timestamptz not null default now(),
  constraint garment_sources_storage_path_unique unique (storage_bucket, storage_path)
);

create index garment_sources_owner_id_idx on garment_sources (owner_id);

alter table garment_sources enable row level security;

create policy garment_sources_select_own
  on garment_sources for select
  using (owner_id = auth.uid());

create policy garment_sources_insert_own
  on garment_sources for insert
  with check (owner_id = auth.uid());

-- creative_analyses ------------------------------------------------------
-- One row per source, transitioning through AnalysisStatus (types/domain.ts)
-- as the user marks and confirms candidate regions manually.

create table creative_analyses (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references garment_sources (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'NOT_ANALYZED' check (
    status in (
      'NOT_ANALYZED', 'ANALYZING', 'ANALYSIS_READY', 'NEEDS_REVIEW',
      'REVIEWED', 'FAILED', 'UNAVAILABLE'
    )
  ),
  -- Only 'manual' is ever written in PR #2. Loosen this constraint when a
  -- real automated provider (e.g. 'adobe') is implemented in PR #5.
  provider text not null default 'manual' check (provider = 'manual'),
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creative_analyses_source_id_unique unique (source_id)
);

create index creative_analyses_owner_id_idx on creative_analyses (owner_id);

alter table creative_analyses enable row level security;

create policy creative_analyses_select_own
  on creative_analyses for select
  using (owner_id = auth.uid());

create policy creative_analyses_insert_own
  on creative_analyses for insert
  with check (owner_id = auth.uid());

create policy creative_analyses_update_own
  on creative_analyses for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger creative_analyses_set_updated_at
  before update on creative_analyses
  for each row execute function set_updated_at();

-- candidate_regions ------------------------------------------------------
-- Human-marked regions of interest. Coordinates are normalized (0-1) so
-- they are independent of the source image's pixel resolution. Manual
-- regions can never carry a confidence value (enforced below) — that
-- field is only meaningful for a future automated provider's detections.

create table candidate_regions (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references creative_analyses (id) on delete cascade,
  source_id uuid not null references garment_sources (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  region_type text not null check (
    region_type in (
      'CHEST_GRAPHIC', 'BACK_GRAPHIC', 'SLEEVE_GRAPHIC', 'LOGO', 'TEXT',
      'ILLUSTRATION', 'PATCH', 'EMBROIDERY', 'PATTERN', 'GARMENT', 'UNKNOWN'
    )
  ),
  x double precision not null check (x >= 0 and x <= 1),
  y double precision not null check (y >= 0 and y <= 1),
  width double precision not null check (width > 0 and width <= 1),
  height double precision not null check (height > 0 and height <= 1),
  label text,
  confidence double precision check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_by text not null default 'manual' check (created_by = 'manual'),
  created_at timestamptz not null default now(),
  constraint candidate_regions_bounds_x check (x + width <= 1.0000001),
  constraint candidate_regions_bounds_y check (y + height <= 1.0000001),
  constraint candidate_regions_manual_no_confidence check (created_by <> 'manual' or confidence is null)
);

create index candidate_regions_analysis_id_idx on candidate_regions (analysis_id);
create index candidate_regions_source_id_idx on candidate_regions (source_id);
create index candidate_regions_owner_id_idx on candidate_regions (owner_id);

alter table candidate_regions enable row level security;

create policy candidate_regions_select_own
  on candidate_regions for select
  using (owner_id = auth.uid());

create policy candidate_regions_insert_own
  on candidate_regions for insert
  with check (owner_id = auth.uid());

create policy candidate_regions_update_own
  on candidate_regions for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy candidate_regions_delete_own
  on candidate_regions for delete
  using (owner_id = auth.uid());

-- extractions ------------------------------------------------------
-- A persisted extraction intent: "this reviewed region should become an
-- extraction." No crop/processing pipeline exists yet in PR #2, so
-- status stays 'PENDING' and storage_path stays null — never fabricated.

create table extractions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references garment_sources (id) on delete cascade,
  candidate_region_id uuid not null references candidate_regions (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  storage_path text,
  created_by text not null default 'manual' check (created_by = 'manual'),
  created_at timestamptz not null default now()
);

create index extractions_source_id_idx on extractions (source_id);
create index extractions_candidate_region_id_idx on extractions (candidate_region_id);
create index extractions_owner_id_idx on extractions (owner_id);

-- Defense in depth beyond the foreign keys: a region's own source_id must
-- match the extraction's declared source_id, so an extraction can never
-- reference a region that actually belongs to a different source.
create or replace function validate_extraction_region_source()
returns trigger
language plpgsql
as $$
declare
  region_source_id uuid;
begin
  select source_id into region_source_id
    from candidate_regions
    where id = new.candidate_region_id;

  if region_source_id is null then
    raise exception 'candidate_region % does not exist', new.candidate_region_id;
  end if;

  if region_source_id <> new.source_id then
    raise exception 'candidate_region % does not belong to source %',
      new.candidate_region_id, new.source_id;
  end if;

  return new;
end;
$$;

create trigger extractions_validate_region_source
  before insert or update on extractions
  for each row execute function validate_extraction_region_source();

alter table extractions enable row level security;

create policy extractions_select_own
  on extractions for select
  using (owner_id = auth.uid());

create policy extractions_insert_own
  on extractions for insert
  with check (owner_id = auth.uid());

-- Storage ------------------------------------------------------
-- Private bucket for original source uploads. Objects are keyed
-- "<owner_id>/...", and storage RLS restricts every client-role operation
-- to the owner's own folder. Only INSERT and SELECT policies exist: an
-- uploaded object can never be overwritten or removed by any client role.

insert into storage.buckets (id, name, public)
values ('garment-sources', 'garment-sources', false)
on conflict (id) do nothing;

create policy garment_sources_storage_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'garment-sources'
    and (storage.foldername(name)) [1] = auth.uid()::text
  );

create policy garment_sources_storage_select_own
  on storage.objects for select
  using (
    bucket_id = 'garment-sources'
    and (storage.foldername(name)) [1] = auth.uid()::text
  );
