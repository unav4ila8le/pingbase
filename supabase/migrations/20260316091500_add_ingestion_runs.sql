create type public.ingestion_run_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed'
);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on update cascade on delete cascade,
  source text not null default 'manual',
  scope text not null default 'all_targets',
  target_id uuid references public.targets (id) on update cascade on delete cascade,
  target_ids uuid[] not null default '{}'::uuid[],
  status public.ingestion_run_status not null default 'queued',
  target_count integer not null default 0,
  completed_target_count integer not null default 0,
  error_target_count integer not null default 0,
  result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  constraint ingestion_runs_source_check check (source in ('manual', 'cron')),
  constraint ingestion_runs_scope_check check (scope in ('all_targets', 'target')),
  constraint ingestion_runs_scope_target_check check (
    (scope = 'all_targets' and target_id is null)
    or (scope = 'target' and target_id is not null)
  ),
  constraint ingestion_runs_target_ids_count_check check (
    cardinality(target_ids) = target_count
  ),
  constraint ingestion_runs_target_count_check check (target_count >= 0),
  constraint ingestion_runs_completed_target_count_check check (completed_target_count >= 0),
  constraint ingestion_runs_error_target_count_check check (error_target_count >= 0)
);

create index ingestion_runs_user_id_created_at_idx
  on public.ingestion_runs (user_id, created_at desc);

create unique index ingestion_runs_one_active_all_targets_per_user_idx
  on public.ingestion_runs (user_id)
  where scope = 'all_targets' and status in ('queued', 'running');

create unique index ingestion_runs_one_active_target_per_user_idx
  on public.ingestion_runs (user_id, target_id)
  where scope = 'target' and status in ('queued', 'running');

create index ingestion_runs_user_id_target_id_created_at_idx
  on public.ingestion_runs (user_id, target_id, created_at desc);

create trigger ingestion_runs_set_updated_at
  before update on public.ingestion_runs
  for each row execute function public.handle_updated_at();

alter table public.ingestion_runs enable row level security;

create policy "Users can select own ingestion runs"
  on public.ingestion_runs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own ingestion runs"
  on public.ingestion_runs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own ingestion runs"
  on public.ingestion_runs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.ingestion_runs is
  'Tracks durable ingestion runs so UI state survives refreshes and navigation.';
