-- Run once in Supabase SQL Editor, after the initial/repair migrations.
-- Stores only age eligibility attestation, not a birth date. No parental consent system.
begin;
create or replace function public.enforce_focusly_signup_eligibility()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.raw_user_meta_data->>'age_13_or_older' is distinct from 'true'
    or new.raw_user_meta_data->>'privacy_policy_version' is distinct from '2026-10-26' then
  raise exception 'Focusly signup requires age 13+ eligibility and privacy acknowledgement';
 end if;
 return new;
end;
$$;
revoke all on function public.enforce_focusly_signup_eligibility() from public, anon, authenticated;
drop trigger if exists focusly_signup_eligibility on auth.users;
create trigger focusly_signup_eligibility before insert on auth.users
for each row execute function public.enforce_focusly_signup_eligibility();
commit;
