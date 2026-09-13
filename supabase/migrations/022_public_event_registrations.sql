-- Public registrations for one-off events, starting with नमो सेवा सम्मान - 2026.
--
-- Unlike event_registrations (members signing up for an events row), these
-- come from anonymous visitors who are usually not members, so the row carries
-- the person's own details instead of a member_id.
--
-- Nobody but admins touches the table through the API. The public register
-- route and the QR verification page run with the service role, which bypasses
-- RLS: the route validates the form, needs the registration number the sequence
-- hands out, and sets invitation_sent once the letter is mailed — none of which
-- an anonymous browser insert could do, and allowing one would let a script skip
-- the route's validation and honeypot entirely.

CREATE SEQUENCE IF NOT EXISTS public.public_event_registration_number_seq;

CREATE TABLE IF NOT EXISTS public.public_event_registrations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- One sequence across events; numbers are formatted per event in the app
  -- (7 → BNMS/NSS2026/0007). Default matches EVENT_SLUG in namo-sewa-samman.ts.
  event_slug          TEXT NOT NULL DEFAULT 'namo-sewa-samman-2026',
  registration_number INTEGER NOT NULL UNIQUE
                        DEFAULT nextval('public.public_event_registration_number_seq'),

  full_name           TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  guardian_name       TEXT NOT NULL CHECK (char_length(guardian_name) BETWEEN 1 AND 120),
  mobile              TEXT NOT NULL CHECK (mobile ~ '^[6-9][0-9]{9}$'),
  email               TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  address             TEXT NOT NULL CHECK (char_length(address) BETWEEN 1 AND 500),

  invitation_sent     BOOLEAN NOT NULL DEFAULT false,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.public_event_registration_number_seq
  OWNED BY public.public_event_registrations.registration_number;

-- The register route looks up a repeat submission by event + mobile + email.
CREATE INDEX IF NOT EXISTS idx_public_event_registrations_lookup
  ON public.public_event_registrations(event_slug, mobile, email);

DROP TRIGGER IF EXISTS public_event_registrations_updated_at ON public.public_event_registrations;
CREATE TRIGGER public_event_registrations_updated_at
  BEFORE UPDATE ON public.public_event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- Holds mobile numbers, emails and home addresses: admins only. No policy for
-- anon at all, so the anon key can neither read nor write it.
ALTER TABLE public.public_event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage public event registrations" ON public.public_event_registrations;
CREATE POLICY "Admins can manage public event registrations" ON public.public_event_registrations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.public_event_registrations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_event_registrations TO authenticated;
