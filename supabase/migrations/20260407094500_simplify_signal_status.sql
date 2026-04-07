-- Simplify signal workflow to unread/read semantics.
-- Existing non-new statuses are preserved as "seen".

do $$
begin
  if exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'signal_status'
  ) and exists (
    select 1
    from pg_enum
    where enumtypid = 'public.signal_status'::regtype
      and enumlabel = 'ignored'
  ) then
    create type public.signal_status_v2 as enum ('new', 'seen');

    alter table public.signals
      alter column status drop default;

    alter table public.signals
      alter column status type public.signal_status_v2
      using (
        case
          when status::text = 'new' then 'new'::public.signal_status_v2
          else 'seen'::public.signal_status_v2
        end
      );

    drop type public.signal_status;
    alter type public.signal_status_v2 rename to signal_status;

    alter table public.signals
      alter column status set default 'new'::public.signal_status;
  end if;
end $$;
