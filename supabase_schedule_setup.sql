-- جدول العمل السحابي المشترك لمشروع HOUSE SOLUTIONS
-- شغّل هذا الملف من Supabase Dashboard > SQL Editor > New query > Run
-- الملف آمن لإعادة التشغيل، ويضيف حقول الموقع وحالة الإنجاز للجدول القديم إن كان موجودًا.

create extension if not exists pgcrypto;

create table if not exists public.work_schedule_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 300),
  task_date date not null,
  task_time time without time zone not null,
  task_location text not null default '',
  is_completed boolean not null default false,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ترقية جدول V6 القديم بدون حذف أي مهام موجودة.
alter table public.work_schedule_tasks
  add column if not exists task_location text not null default '';

alter table public.work_schedule_tasks
  add column if not exists is_completed boolean not null default false;

create index if not exists work_schedule_tasks_date_time_idx
  on public.work_schedule_tasks (task_date, task_time);

create index if not exists work_schedule_tasks_completion_idx
  on public.work_schedule_tasks (is_completed, task_date);

create or replace function public.set_work_schedule_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_work_schedule_updated_at on public.work_schedule_tasks;
create trigger trg_work_schedule_updated_at
before update on public.work_schedule_tasks
for each row execute function public.set_work_schedule_updated_at();

alter table public.work_schedule_tasks enable row level security;

drop policy if exists "schedule_admin_select" on public.work_schedule_tasks;
drop policy if exists "schedule_admin_insert" on public.work_schedule_tasks;
drop policy if exists "schedule_admin_update" on public.work_schedule_tasks;
drop policy if exists "schedule_admin_delete" on public.work_schedule_tasks;

create policy "schedule_admin_select"
on public.work_schedule_tasks
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'admin@company.local');

create policy "schedule_admin_insert"
on public.work_schedule_tasks
for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'admin@company.local');

create policy "schedule_admin_update"
on public.work_schedule_tasks
for update
to authenticated
using ((auth.jwt() ->> 'email') = 'admin@company.local')
with check ((auth.jwt() ->> 'email') = 'admin@company.local');

create policy "schedule_admin_delete"
on public.work_schedule_tasks
for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'admin@company.local');

grant select, insert, update, delete on public.work_schedule_tasks to authenticated;

-- تفعيل Realtime للجدول الجديد مع حماية من التكرار عند إعادة تشغيل الملف.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'work_schedule_tasks'
  ) then
    alter publication supabase_realtime add table public.work_schedule_tasks;
  end if;
end
$$;
