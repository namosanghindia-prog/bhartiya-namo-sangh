-- Printed ID card orders.
--
-- Members order a physical copy of their membership card. Razorpay is not wired
-- up yet, so every order starts as 'pending_payment' and an admin moves it
-- forward once payment is confirmed out of band. When Razorpay lands, the
-- checkout flow fills payment_provider/payment_ref and flips status to 'paid';
-- nothing else here needs to change.

-- Unit price in paise, kept in one place so the trigger below and any future
-- Razorpay order creation agree on what a card costs.
CREATE OR REPLACE FUNCTION public.id_card_unit_price_paise()
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 20000; $$;   -- ₹200.00 per card

CREATE TABLE IF NOT EXISTS id_card_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id        UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  quantity         INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 5),

  -- Delivery details are captured per order: a member may ship to an address
  -- other than the one on their profile.
  delivery_name    TEXT NOT NULL,
  phone            TEXT NOT NULL,
  address_line     TEXT NOT NULL,
  city             TEXT NOT NULL,
  state            TEXT NOT NULL,
  pincode          TEXT NOT NULL,

  -- Authoritative price. Always recomputed by trigger, never trusted from the
  -- client, so a member cannot post their own amount.
  amount_paise     INTEGER NOT NULL DEFAULT 0,

  status           TEXT NOT NULL DEFAULT 'pending_payment'
                   CHECK (status IN ('pending_payment','paid','printing','shipped','delivered','cancelled')),
  payment_provider TEXT,
  payment_ref      TEXT,
  admin_note       TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_id_card_orders_member  ON id_card_orders(member_id);
CREATE INDEX IF NOT EXISTS idx_id_card_orders_status  ON id_card_orders(status);
CREATE INDEX IF NOT EXISTS idx_id_card_orders_created ON id_card_orders(created_at DESC);

-- Price is derived from quantity, so the client cannot choose what to pay.
CREATE OR REPLACE FUNCTION public.set_id_card_order_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.amount_paise := NEW.quantity * public.id_card_unit_price_paise();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_id_card_order_amount ON public.id_card_orders;
CREATE TRIGGER trg_set_id_card_order_amount
  BEFORE INSERT OR UPDATE OF quantity ON public.id_card_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_id_card_order_amount();

DROP TRIGGER IF EXISTS id_card_orders_updated_at ON public.id_card_orders;
CREATE TRIGGER id_card_orders_updated_at
  BEFORE UPDATE ON id_card_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE id_card_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own id card orders" ON id_card_orders;
CREATE POLICY "Members can view own id card orders" ON id_card_orders
  FOR SELECT USING (member_id = auth.uid());

DROP POLICY IF EXISTS "Members can place own id card orders" ON id_card_orders;
CREATE POLICY "Members can place own id card orders" ON id_card_orders
  FOR INSERT WITH CHECK (member_id = auth.uid());

-- Deliberately no member UPDATE policy: a member who could update their own row
-- could set status = 'paid' themselves. Cancellations and address corrections
-- go through an admin until Razorpay owns the paid transition.
DROP POLICY IF EXISTS "Admins can manage all id card orders" ON id_card_orders;
CREATE POLICY "Admins can manage all id card orders" ON id_card_orders
  FOR ALL USING (is_admin());
