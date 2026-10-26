-- Repair partial Focusly setup. Run this entire file in the Supabase SQL Editor.
-- Preserves records; replaces existing table policies with owner-only access.
begin;
create table if not exists public.classes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 80),
 color text not null default '#7065F0' check (color ~ '^#[0-9a-fA-F]{6}$'),
 created_at timestamptz not null default now(),
 unique (id, user_id)
);
-- This index also supplies the composite ownership key if classes existed already.
create unique index if not exists classes_owner_reference_idx on public.classes(id, user_id);
create table if not exists public.assignments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 class_id uuid,
 title text not null check (char_length(trim(title)) between 1 and 160),
 due_date date not null,
 priority text not null default 'medium' check (priority in ('low','medium','high')),
 completed boolean not null default false,
 created_at timestamptz not null default now(),
 foreign key (class_id, user_id) references public.classes(id, user_id) on delete set null (class_id)
);
create index if not exists classes_user_idx on public.classes(user_id);
create index if not exists assignments_user_due_idx on public.assignments(user_id, due_date);
alter table public.classes enable row level security;
alter table public.assignments enable row level security;
-- Policies combine with OR, so replace prior policies to prevent broader access.
do $$
declare item record;
begin
 for item in select schemaname, tablename, policyname from pg_policies
 where schemaname = 'public' and tablename in ('classes', 'assignments')
 loop
  execute format('drop policy %I on %I.%I', item.policyname, item.schemaname, item.tablename);
 end loop;
end $$;
create policy "Owners manage classes" on public.classes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners manage assignments" on public.assignments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.classes, public.assignments from public, anon, authenticated;
grant select, insert, update, delete on public.classes, public.assignments to authenticated;
notify pgrst, 'reload schema';
commit;
