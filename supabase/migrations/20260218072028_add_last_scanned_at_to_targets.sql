-- Add last_scanned_at to targets for ingestion time-window optimization.
-- Only consider posts newer than last_scanned_at to avoid re-fetching and re-scoring
-- signals we already have. First run uses (created_at - 24h) as fallback.

alter table public.targets
  add column if not exists last_scanned_at timestamptz;

comment on column public.targets.last_scanned_at is
  'Timestamp of last successful ingestion run for this target. Used to only process posts newer than this.';
