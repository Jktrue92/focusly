-- Apply after study_tools. Recurring meeting times are distinct from assignment due dates.
begin;
create table public.class_meetings (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 class_id uuid not null,
 weekday integer not null check(weekday between 0 and 6),
 start_time time not null,
 end_time time not null check(end_time>start_time),
 term_start date not null,
 term_end date not null check(term_end>=term_start and term_end-term_start<=366),
 timezone text not null check(char_length(timezone) between 1 and 80),
 created_at timestamptz not null default now(),
 foreign key(class_id,user_id) references public.classes(id,user_id) on delete cascade,
 unique(user_id,class_id,weekday,start_time,end_time,term_start,term_end,timezone)
);
create index class_meetings_user_day_idx on public.class_meetings(user_id,weekday);
alter table public.class_meetings enable row level security;
create policy "Owners manage class meetings" on public.class_meetings for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create table public.schedule_imports (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 token uuid not null,
 result jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 primary key(user_id,token)
);
alter table public.schedule_imports enable row level security;
create policy "Owners manage import receipts" on public.schedule_imports for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
revoke all on public.class_meetings,public.schedule_imports from public,anon,authenticated;
grant select,insert,update,delete on public.class_meetings,public.schedule_imports to authenticated;
create function public.import_reviewed_schedule(draft jsonb,chosen_start date,chosen_end date,chosen_timezone text,import_token uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare actor uuid:=auth.uid(); class_item jsonb; assignment_item jsonb; meeting jsonb; selected_id uuid; class_ids uuid[]:=array[]::uuid[]; class_idx integer; class_count integer:=0; meeting_count integer:=0; assignment_count integer:=0; inserted integer; receipt uuid; result_payload jsonb;
begin
 if actor is null or import_token is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if chosen_start is null or chosen_end is null or chosen_end<chosen_start or chosen_end-chosen_start>366 or not exists(select 1 from pg_catalog.pg_timezone_names where name=chosen_timezone) then raise exception 'Check term dates and timezone'; end if;
 if jsonb_typeof(draft->'classes') is distinct from 'array' or jsonb_typeof(draft->'assignments') is distinct from 'array' or jsonb_array_length(draft->'classes')>12 or jsonb_array_length(draft->'assignments')>30 then raise exception 'Invalid schedule draft'; end if;
 insert into public.schedule_imports(user_id,token) values(actor,import_token) on conflict do nothing returning token into receipt;
 if receipt is null then select s.result into result_payload from public.schedule_imports s where s.user_id=actor and s.token=import_token;return result_payload;end if;
 for class_item in select * from jsonb_array_elements(draft->'classes') loop
  if class_item->>'existing_id' is not null and class_item->>'existing_id'<>'' then
   select id into selected_id from public.classes where id=(class_item->>'existing_id')::uuid and user_id=actor;
   if selected_id is null then raise exception 'Class unavailable' using errcode='42501';end if;
  else
   insert into public.classes(user_id,name,color) values(actor,class_item->>'name',coalesce(class_item->>'color','#7065F0')) returning id into selected_id;
   class_count:=class_count+1;
  end if;
  class_ids:=array_append(class_ids,selected_id);
  if jsonb_typeof(class_item->'meetings') is distinct from 'array' or jsonb_array_length(class_item->'meetings')>7 then raise exception 'Invalid meeting count';end if;
  for meeting in select * from jsonb_array_elements(class_item->'meetings') loop
   insert into public.class_meetings(user_id,class_id,weekday,start_time,end_time,term_start,term_end,timezone) values(actor,selected_id,(meeting->>'weekday')::integer,(meeting->>'start_time')::time,(meeting->>'end_time')::time,chosen_start,chosen_end,chosen_timezone) on conflict do nothing;
   get diagnostics inserted=row_count;meeting_count:=meeting_count+inserted;
  end loop;
 end loop;
 for assignment_item in select * from jsonb_array_elements(draft->'assignments') loop
  selected_id:=null;
  if assignment_item->>'class_index' is not null then
   class_idx:=(assignment_item->>'class_index')::integer;
   if class_idx<0 or class_idx>=coalesce(array_length(class_ids,1),0) then raise exception 'Choose a valid class';end if;
   selected_id:=class_ids[class_idx+1];
  end if;
  if (assignment_item->>'due_date')::date<chosen_start or (assignment_item->>'due_date')::date>chosen_end then raise exception 'Deadline outside confirmed term dates';end if;
  insert into public.assignments(user_id,class_id,title,due_date,priority) values(actor,selected_id,assignment_item->>'title',(assignment_item->>'due_date')::date,coalesce(assignment_item->>'priority','medium'));
  assignment_count:=assignment_count+1;
 end loop;
 if class_count+meeting_count+assignment_count=0 then raise exception 'Nothing new to import';end if;
 result_payload:=jsonb_build_object('classes',class_count,'meetings',meeting_count,'assignments',assignment_count);
 update public.schedule_imports s set result=result_payload where s.user_id=actor and s.token=import_token;
 return result_payload;
end; $$;
revoke all on function public.import_reviewed_schedule(jsonb,date,date,text,uuid) from public,anon;
grant execute on function public.import_reviewed_schedule(jsonb,date,date,text,uuid) to authenticated;
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501';end if;
 delete from public.class_meetings where user_id=actor;
 delete from public.schedule_imports where user_id=actor;
 delete from public.flashcard_progress where user_id=actor;
 delete from public.flashcards where user_id=actor;
 delete from public.study_decks where user_id=actor;
 delete from public.ai_usage where user_id=actor;
 delete from public.assignments where user_id=actor;
 delete from public.classes where user_id=actor;
 delete from auth.users where id=actor;
 if not found then raise exception 'Account not found' using errcode='42501';end if;
end; $$;
revoke all on function public.delete_own_account() from public,anon;
grant execute on function public.delete_own_account() to authenticated;
notify pgrst,'reload schema';
commit;
