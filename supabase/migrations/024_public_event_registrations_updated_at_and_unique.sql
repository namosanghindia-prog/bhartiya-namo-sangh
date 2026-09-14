-- Two repairs to public_event_registrations, found while tracing a failed
-- नमो सेवा सम्मान - 2026 registration on 14 September 2026.
--
-- 1. The live table has no updated_at column, but 022's BEFORE UPDATE trigger
--    still calls update_updated_at(), which sets NEW.updated_at. So every
--    UPDATE on the table failed with
--      record "new" has no field "updated_at"   (42703)
--    and the register route could never set invitation_sent = true — the
--    letters went out through Resend, but the admin list showed every
--    registration as "Not sent". Adding the column makes the trigger valid
--    again. moderator_requests gets the same guard: it carries the same
--    trigger, and an admin approving a request is an UPDATE.
--
-- 2. The route already treats a repeat of the same mobile + email as the same
--    person and returns their existing number instead of a second one, but
--    only after a lookup that two simultaneous submissions can both pass. The
--    unique index makes the database enforce the rule; the route answers a
--    unique violation by returning the existing registration. The non-unique
--    lookup index from 022 is redundant once this one exists.

ALTER TABLE public.public_event_registrations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.moderator_requests
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS public_event_registrations_one_per_person
  ON public.public_event_registrations(event_slug, mobile, email);

DROP INDEX IF EXISTS public.idx_public_event_registrations_lookup;
