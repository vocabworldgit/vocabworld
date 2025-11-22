-- Run this query to see what triggers and functions exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
ORDER BY trigger_name;
