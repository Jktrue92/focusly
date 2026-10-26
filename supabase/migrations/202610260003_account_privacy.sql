-- Self-service deletion with no privileged API key in the application.
-- Run after the initial/repair and signup-eligibility migrations.
begin;
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = '' as $$
declare requesting_user uuid := auth.uid();
begin
 if requesting_user is null then
  raise exception 'Authentication required' using errcode = '42501';
 end if;
 -- Explicit cleanup also handles older tables that lack cascading auth foreign keys.
 delete from public.assignments where user_id = requesting_user;
 delete from public.classes where user_id = requesting_user;
 delete from auth.users where id = requesting_user;
 if not found then
  raise exception 'Account not found' using errcode = '42501';
 end if;
end;
$$;
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
notify pgrst, 'reload schema';
commit;
