-- Structured scoring fields for precision-first signal quality (v2).
-- Phase 2 migration only: schema additions + indexes.

alter table public.signals
  add column if not exists specific_ask boolean not null default false,
  add column if not exists fit_grade text not null default 'none',
  add column if not exists promo_risk text not null default 'high',
  add column if not exists scorer_confidence integer not null default 0,
  add column if not exists rejection_reason text,
  add column if not exists evidence_quote text,
  add column if not exists stage1_score integer,
  add column if not exists validator_decision text,
  add column if not exists validator_confidence integer,
  add column if not exists validator_reason text,
  add column if not exists score_version text not null default 'v2';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'signals_fit_grade_check'
      and conrelid = 'public.signals'::regclass
  ) then
    alter table public.signals
      add constraint signals_fit_grade_check
      check (fit_grade in ('none', 'partial', 'strong'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'signals_promo_risk_check'
      and conrelid = 'public.signals'::regclass
  ) then
    alter table public.signals
      add constraint signals_promo_risk_check
      check (promo_risk in ('low', 'medium', 'high'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'signals_scorer_confidence_check'
      and conrelid = 'public.signals'::regclass
  ) then
    alter table public.signals
      add constraint signals_scorer_confidence_check
      check (scorer_confidence between 0 and 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'signals_stage1_score_check'
      and conrelid = 'public.signals'::regclass
  ) then
    alter table public.signals
      add constraint signals_stage1_score_check
      check (stage1_score is null or stage1_score between 0 and 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'signals_validator_decision_check'
      and conrelid = 'public.signals'::regclass
  ) then
    alter table public.signals
      add constraint signals_validator_decision_check
      check (validator_decision is null or validator_decision in ('approve', 'reject'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'signals_validator_confidence_check'
      and conrelid = 'public.signals'::regclass
  ) then
    alter table public.signals
      add constraint signals_validator_confidence_check
      check (
        validator_confidence is null
        or validator_confidence between 0 and 100
      );
  end if;
end $$;

create index if not exists signals_target_score_date_idx
  on public.signals (target_id, score desc, date_posted desc);

create index if not exists signals_strict_show_idx
  on public.signals (target_id, score desc, date_posted desc)
  where score >= 75
    and specific_ask is true
    and fit_grade = 'strong'
    and promo_risk = 'low'
    and validator_decision = 'approve'
    and validator_confidence >= 70;
