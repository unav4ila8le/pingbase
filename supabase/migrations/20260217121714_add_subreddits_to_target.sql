alter table public.targets
  add column if not exists subreddits text[] not null default '{}'::text[];