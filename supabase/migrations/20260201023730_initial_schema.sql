-- Initial schema for Pingbase.

-- Extensions
create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;

-- Enums
do $$ begin
  create type public.signal_status as enum ('new', 'ignored', 'replied');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.signal_type as enum ('post', 'comment');
exception
  when duplicate_object then null;
end $$;

-- Updated at trigger helper (no dependency on Supabase storage schema)
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on update cascade on delete cascade,
  username extensions.citext unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, username, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Users can select own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Targets
create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on update cascade on delete cascade,
  name text not null,
  description text not null,
  url text,
  keywords text[] not null default '{}'::text[],
  exclusions text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index targets_user_id_idx on public.targets (user_id);

create trigger targets_set_updated_at
  before update on public.targets
  for each row execute function public.handle_updated_at();

alter table public.targets enable row level security;

create policy "Users can select own targets"
  on public.targets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own targets"
  on public.targets
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own targets"
  on public.targets
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own targets"
  on public.targets
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Signals
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.targets (id) on update cascade on delete cascade,
  user_id uuid not null references auth.users (id) on update cascade on delete cascade,
  platform text not null,
  type public.signal_type not null,
  url text not null,
  external_id text not null,
  community text not null,
  title text,
  content_excerpt text not null,
  date_posted timestamptz not null,
  score integer not null,
  reason text not null,
  status public.signal_status not null default 'new',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signals_score_check check (score between 0 and 100)
);

create unique index signals_dedupe_idx
  on public.signals (target_id, platform, external_id);

create index signals_user_id_idx on public.signals (user_id);
create index signals_target_id_idx on public.signals (target_id);
create index signals_target_status_date_idx
  on public.signals (target_id, status, date_posted desc);

create trigger signals_set_updated_at
  before update on public.signals
  for each row execute function public.handle_updated_at();

alter table public.signals enable row level security;

create policy "Users can select own signals"
  on public.signals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own signals"
  on public.signals
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.targets
      where public.targets.id = target_id
        and public.targets.user_id = user_id
    )
  );

create policy "Users can update own signals"
  on public.signals
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own signals"
  on public.signals
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
