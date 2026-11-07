-- Read-only check after apply-00052.sql. Expect: true, true, false, false.
select
  exists (select 1 from pg_proc where proname = 'check_in_with_pass') as scan_fn,
  has_function_privilege('authenticated', 'public.check_in_with_pass(text)', 'EXECUTE') as staff_can_scan,
  has_function_privilege('anon', 'public.check_in_with_pass(text)', 'EXECUTE') as anon_can_scan,
  exists (select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'offerings' and column_name = 'purchase_scope') as m50_applied;
