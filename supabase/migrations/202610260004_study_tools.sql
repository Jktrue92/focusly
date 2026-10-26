-- Run the entire migration in Supabase SQL Editor after prior migrations.
begin;
create table public.study_decks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check(char_length(trim(title)) between 1 and 120),
 description text not null default '' check(char_length(description)<=500),
 color text not null default '#7065F0' check(color ~ '^#[0-9a-fA-F]{6}$'),
 created_at timestamptz not null default now(),
 unique(id,user_id)
);
create table public.flashcards (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 deck_id uuid not null,
 term text not null check(char_length(trim(term)) between 1 and 300),
 definition text not null check(char_length(trim(definition)) between 1 and 2000),
 source_excerpt text not null default '' check(char_length(source_excerpt)<=800),
 created_at timestamptz not null default now(),
 foreign key(deck_id,user_id) references public.study_decks(id,user_id) on delete cascade,
 unique(id,user_id)
);
-- Serialize per-deck inserts/moves so concurrent clients cannot bypass the cap.
create function public.enforce_flashcard_limit()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.study_decks where id=new.deck_id and user_id=new.user_id for update;
 if (select count(*) from public.flashcards where deck_id=new.deck_id and user_id=new.user_id and id<>new.id)>=200 then
  raise exception 'Each set supports up to 200 cards';
 end if;
 return new;
end; $$;
revoke all on function public.enforce_flashcard_limit() from public,anon,authenticated;
create trigger flashcard_limit before insert or update of deck_id,user_id on public.flashcards for each row execute function public.enforce_flashcard_limit();
create table public.flashcard_progress (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 card_id uuid not null,
 known boolean not null default false,
 review_count integer not null default 0 check(review_count>=0),
 last_reviewed timestamptz not null default now(),
 primary key(card_id,user_id),
 foreign key(card_id,user_id) references public.flashcards(id,user_id) on delete cascade
);
create index study_decks_user_idx on public.study_decks(user_id);
create index flashcards_deck_user_idx on public.flashcards(deck_id,user_id);
create index flashcard_progress_user_idx on public.flashcard_progress(user_id);
alter table public.study_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_progress enable row level security;
create policy "Owners manage study decks" on public.study_decks for all to authenticated using ((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "Owners manage flashcards" on public.flashcards for all to authenticated using ((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "Owners manage study progress" on public.flashcard_progress for all to authenticated using ((select auth.uid())=user_id) with check((select auth.uid())=user_id);
revoke all on public.study_decks,public.flashcards,public.flashcard_progress from public,anon,authenticated;
grant select,insert,update,delete on public.study_decks,public.flashcards,public.flashcard_progress to authenticated;
create function public.record_card_review(target_card uuid,was_correct boolean)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or was_correct is null or not exists(select 1 from public.flashcards where id=target_card and user_id=auth.uid()) then
  raise exception 'Card unavailable' using errcode='42501';
 end if;
 insert into public.flashcard_progress(card_id,user_id,known,review_count,last_reviewed)
 values(target_card,auth.uid(),was_correct,1,now())
 on conflict(card_id,user_id) do update set known=excluded.known,review_count=public.flashcard_progress.review_count+1,last_reviewed=now();
end; $$;
revoke all on function public.record_card_review(uuid,boolean) from public,anon;
grant execute on function public.record_card_review(uuid,boolean) to authenticated;
-- Server-enforced AI attempt quotas. No notes or prompts are stored here.
create table public.ai_usage (
 user_id uuid primary key references auth.users(id) on delete cascade,
 hour_start timestamptz not null default now(),
 hour_count integer not null default 0,
 day_start date not null default current_date,
 day_count integer not null default 0,
 last_request timestamptz,
 last_consent_at timestamptz,
 consent_version text not null default '2026-10-26-ai-beta'
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from public,anon,authenticated;
create function public.claim_ai_request()
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); usage public.ai_usage; current_time_utc timestamptz:=clock_timestamp(); utc_day date:=(clock_timestamp() at time zone 'UTC')::date;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 insert into public.ai_usage(user_id,day_start) values(actor,utc_day) on conflict do nothing;
 select * into usage from public.ai_usage where user_id=actor for update;
 if usage.last_request is not null and current_time_utc-usage.last_request < interval '60 seconds' then return false; end if;
 if current_time_utc-usage.hour_start>=interval '1 hour' then usage.hour_start:=current_time_utc; usage.hour_count:=0; end if;
 if usage.day_start<>utc_day then usage.day_start:=utc_day; usage.day_count:=0; end if;
 if usage.hour_count>=5 or usage.day_count>=20 then return false; end if;
 update public.ai_usage set hour_start=usage.hour_start,hour_count=usage.hour_count+1,day_start=usage.day_start,day_count=usage.day_count+1,last_request=current_time_utc,last_consent_at=current_time_utc where user_id=actor;
 return true;
end; $$;
revoke all on function public.claim_ai_request() from public,anon;
grant execute on function public.claim_ai_request() to authenticated;
create function public.get_own_ai_usage()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 return (select jsonb_build_object('hour_start',hour_start,'hour_count',hour_count,'day_start',day_start,'day_count',day_count,'last_request',last_request,'last_consent_at',last_consent_at,'consent_version',consent_version) from public.ai_usage where user_id=auth.uid());
end; $$;
revoke all on function public.get_own_ai_usage() from public,anon;
grant execute on function public.get_own_ai_usage() to authenticated;
-- Keep self-service deletion complete even on legacy tables without auth cascades.
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 delete from public.flashcard_progress where user_id=actor;
 delete from public.flashcards where user_id=actor;
 delete from public.study_decks where user_id=actor;
 delete from public.ai_usage where user_id=actor;
 delete from public.assignments where user_id=actor;
 delete from public.classes where user_id=actor;
 delete from auth.users where id=actor;
 if not found then raise exception 'Account not found' using errcode='42501'; end if;
end; $$;
revoke all on function public.delete_own_account() from public,anon;
grant execute on function public.delete_own_account() to authenticated;
notify pgrst,'reload schema';
commit;
