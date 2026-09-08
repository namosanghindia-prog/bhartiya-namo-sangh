-- Let a member actually be deleted.
--
-- Deleting a member deletes their auth.users row, which cascades to
-- public.members. That cascade was being refused: plenty of tables point at
-- members with a plain `REFERENCES members(id)` — no ON DELETE action, so
-- Postgres defaults to NO ACTION and blocks the delete. Supabase reports the
-- refusal as the unhelpful "Database error deleting user".
--
-- Two kinds of reference need two different answers:
--
--   * "who did this" columns — events.organizer_id, donations.verified_by,
--     businesses.payment_confirmed_by, members.membership_payment_confirmed_by
--     and friends. These are nullable, and the record they annotate outlives
--     the person: a donation stays a donation once the admin who verified it
--     is gone. They become ON DELETE SET NULL.
--
--   * columns that are NOT NULL, which is how this schema says "this row
--     belongs to that member" — the row cannot outlive them, so it goes with
--     them. They become ON DELETE CASCADE.
--
-- The constraints are found in the catalog rather than listed by name on
-- purpose: several tables in this project (profile_change_requests among them)
-- were created from the dashboard and are in no migration file, so a hand
-- written list would silently miss them. Only constraints that would actually
-- block a delete are touched — anything already SET NULL or CASCADE is left
-- exactly as it is, which also makes this safe to re-run.

DO $$
DECLARE
  fk RECORD;
  action TEXT;
  definition TEXT;
BEGIN
  FOR fk IN
    SELECT
      c.oid,
      c.conname,
      c.conrelid::regclass::text AS table_name,
      pg_get_constraintdef(c.oid) AS def,
      -- NOT NULL anywhere in the referencing columns means the row cannot be
      -- kept once the member is gone.
      EXISTS (
        SELECT 1
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        WHERE a.attnotnull
      ) AS owns_row
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.confrelid = 'public.members'::regclass
      -- 'a' = NO ACTION, 'r' = RESTRICT. Both refuse the delete.
      AND c.confdeltype IN ('a', 'r')
  LOOP
    action := CASE WHEN fk.owns_row THEN 'CASCADE' ELSE 'SET NULL' END;

    -- RESTRICT prints itself into the definition; NO ACTION does not. Strip
    -- either one so appending our own ON DELETE cannot collide with it.
    definition := regexp_replace(
      fk.def, '\s+ON DELETE (NO ACTION|RESTRICT)', '', 'i'
    );

    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      fk.table_name, fk.conname
    );
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I %s ON DELETE %s',
      fk.table_name, fk.conname, definition, action
    );

    RAISE NOTICE '% on % -> ON DELETE %', fk.conname, fk.table_name, action;
  END LOOP;
END
$$;
