-- Compare this output between local and remote databases after changing the
-- schema. Function bodies are normalized to LF because the pre-migration
-- remote functions were originally saved with Windows CRLF line endings.
WITH signatures AS (
  SELECT
    'columns'::text AS object_type,
    table_name || '|' || ordinal_position::text || '|' || column_name || '|' ||
      data_type || '|' || udt_name || '|' || is_nullable || '|' ||
      coalesce(column_default, '') AS value
  FROM information_schema.columns
  WHERE table_schema = 'public'

  UNION ALL

  SELECT
    'constraints',
    c.relname || '|' || con.conname || '|' || con.contype::text || '|' ||
      pg_get_constraintdef(con.oid, true)
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'

  UNION ALL

  SELECT
    'functions',
    p.proname || '|' || pg_get_function_identity_arguments(p.oid) || '|' ||
      pg_get_function_result(p.oid) || '|' || l.lanname || '|' ||
      p.provolatile::text || '|' || p.prosecdef::text || '|' ||
      coalesce(array_to_string(p.proconfig, ','), '') || '|' ||
      replace(p.prosrc, E'\r\n', E'\n')
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'public'

  UNION ALL

  SELECT
    'policies',
    tablename || '|' || policyname || '|' || permissive || '|' || roles::text ||
      '|' || cmd || '|' || coalesce(qual, '') || '|' || coalesce(with_check, '')
  FROM pg_policies
  WHERE schemaname = 'public'

  UNION ALL

  SELECT 'indexes', tablename || '|' || indexname || '|' || indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'

  UNION ALL

  SELECT
    'triggers',
    c.relname || '|' || t.tgname || '|' || pg_get_triggerdef(t.oid, true)
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal
)
SELECT
  object_type,
  count(*)::bigint AS count,
  md5(string_agg(value, E'\n' ORDER BY value)) AS checksum
FROM signatures
GROUP BY object_type
ORDER BY object_type;
