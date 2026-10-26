-- Run once through Supabase migrations or the SQL editor.
begin;
create table public.classes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 80),
 color text not null default '#7065F0' check (color ~ '^#[0-9a-fA-F]{6}$'),
 created_at timestamptz not null default now(),
 unique (id, user_id)
);
create table public.assignments (
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
create index classes_user_idx on public.classes(user_id);
create index assignments_user_due_idx on public.assignments(user_id, due_date);
alter table public.classes enable row level security;
alter table public.assignments enable row level security;
create policy "Owners manage classes" on public.classes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners manage assignments" on public.assignments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.classes, public.assignments from anon;
grant select, insert, update, delete on public.classes, public.assignments to authenticated;
commit;
