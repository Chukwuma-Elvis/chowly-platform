-- ============================================================================
--  ONE-TIME LOCAL SETUP  -  run this ONCE as the postgres superuser:
--
--      psql -U postgres -f db/00_create_role_and_db.sql
--
--  It creates a dedicated low-privilege role and an empty database for the
--  app. Using a dedicated role (not "postgres") is good practice: the app can
--  only touch its own database, so a bug or leak can't harm the rest of your
--  server.
-- ============================================================================

-- A login role the application connects as. Change the password if you like,
-- but then also change it in your .env DATABASE_URL.
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'chowly_app') THEN
      CREATE ROLE chowly_app LOGIN PASSWORD 'chowly_dev_pw';
   END IF;
END
$$;

-- The database itself, owned by that role.
-- (CREATE DATABASE cannot run inside a DO block or a transaction, hence the
--  \gexec trick: build the statement as text, then execute it only if absent.)
SELECT 'CREATE DATABASE chowly OWNER chowly_app'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chowly')
\gexec

\echo 'Role chowly_app and database chowly are ready.'
