-- Read-only check after apply-00047-00051.sql. Expect every column true.
select
  to_regclass('public.account_deletion_requests') is not null as m47,
  to_regclass('public.account_deletion_reviews') is not null as m48,
  to_regclass('public.account_deletion_executions') is not null as m49,
  exists (select 1 from information_schema.columns where table_schema = 'public'
          and table_name = 'offerings' and column_name = 'purchase_scope') as m50,
  has_function_privilege('authenticated', 'public.request_account_deletion(text)', 'EXECUTE') as m51_member_can_request,
  not has_function_privilege('anon', 'public.request_account_deletion(text)', 'EXECUTE') as anon_cannot_request,
  to_regprocedure('public.check_in_with_pass(text)') is not null as m52_still_there;
