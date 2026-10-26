-- Record the selected provider as part of the latest explicit AI consent.
-- Apply after the study/schedule migrations; existing request limits are preserved.
begin;
create function public.claim_ai_request_for_provider(selected_provider text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if selected_provider is null or selected_provider not in ('openai','cloudflare') then raise exception 'Unsupported AI provider';end if;
 if not public.claim_ai_request() then return false;end if;
 update public.ai_usage set consent_version='2026-10-26-provider-beta/'||selected_provider where user_id=auth.uid();
 return true;
end; $$;
revoke all on function public.claim_ai_request_for_provider(text) from public,anon;
grant execute on function public.claim_ai_request_for_provider(text) to authenticated;
notify pgrst,'reload schema';
commit;
