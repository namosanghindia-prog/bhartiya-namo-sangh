-- Admin-set order for the public members page.
--
-- Admins drag the cards on /admin/member-order into place; this table keeps
-- where each member landed. It sits beside public_members rather than inside
-- it: that view was created by hand in the dashboard, and rebuilding it here
-- would mean guessing its filter. The public page joins the two by member id.
--
-- Members without a row (anyone who joined after the last save) follow the
-- ordered ones, in the page's default designation-then-name order.

CREATE TABLE IF NOT EXISTS public.member_display_order (
  member_id  UUID PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_display_order ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Member display order is viewable by everyone" ON public.member_display_order;
CREATE POLICY "Member display order is viewable by everyone" ON public.member_display_order
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage member display order" ON public.member_display_order;
CREATE POLICY "Admins can manage member display order" ON public.member_display_order
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.member_display_order TO anon, authenticated;

-- Saves a whole order at once: the ids in the order they should appear. The
-- previous order is replaced in the same transaction, so a failed save leaves
-- the old one intact and members dropped from the list lose their stale spot.
CREATE OR REPLACE FUNCTION public.set_member_display_order(member_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can reorder members.' USING ERRCODE = '42501';
  END IF;

  DELETE FROM member_display_order WHERE true;

  INSERT INTO member_display_order (member_id, position)
  SELECT t.id, t.ord::INTEGER
  FROM unnest(member_ids) WITH ORDINALITY AS t(id, ord)
  WHERE EXISTS (SELECT 1 FROM members m WHERE m.id = t.id);
END;
$$;

REVOKE ALL ON FUNCTION public.set_member_display_order(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_display_order(UUID[]) TO authenticated;
