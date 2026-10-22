# Supabase database workflow

This directory is the version-controlled source of truth for the database schema.

## Baseline

`migrations/20261022074118_baseline.sql` captures the existing `TastyClone`
database as of 2026-10-22. The same version is marked as applied in the remote
Supabase migration history, so `db push` will not replay the baseline remotely.

The generated baseline intentionally moves the `public` schema ACL revocations
to the end of the file. The original pg-delta output revoked
`pg_database_owner` before creating objects, which prevents a clean database
from creating the first sequence.

The old remote function bodies were saved with Windows CRLF line endings while
the migration is stored with LF line endings. Schema diff tools therefore show
function replacements even when the SQL is semantically identical. Use
`tests/baseline_checksums.sql` to compare normalized schema checksums before
treating this output as real drift.

## First-time local setup

Requirements:

- Docker Desktop is running.
- Dependencies are installed with `npm install`.

Start the local stack:

```bash
npm run supabase:start
```

Rebuild the local database entirely from migrations and seed data:

```bash
npm run db:reset
```

Validate the normalized local schema fingerprint:

```bash
npx supabase db query --local --file supabase/tests/baseline_checksums.sql
```

Stop the local stack when it is no longer needed:

```bash
npm run supabase:stop
```

## Future schema changes

1. Create a migration with `npx supabase migration new <descriptive_name>`.
2. Write and review the SQL in the generated migration.
3. Run `npm run db:reset` to verify the complete migration chain.
4. Run Supabase security and performance advisors.
5. Preview remote changes with `npx supabase db push --dry-run`.
6. Apply them with `npx supabase db push` only after review.

Never use `supabase db reset --linked` against production. Do not commit real
user data, access tokens, database passwords, or service-role keys.
