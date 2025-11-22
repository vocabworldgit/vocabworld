-- Remove the OLD broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_subscription() CASCADE;

-- Verify only our new trigger remains
SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND NOT t.tgisinternal
ORDER BY t.tgname;
