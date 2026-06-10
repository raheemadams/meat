-- Server-side authoritative pricing.
-- Previously order pricing was computed in the browser and trusted on insert,
-- and create-payment-intent charged a client-supplied amount. This lets the
-- server be the source of truth: a single pricing function + a BEFORE INSERT
-- trigger that overwrites the pricing (and each portion owner's amount) on every
-- order, and which create-payment-intent calls via RPC to compute the charge.
--
-- ⚠️ The price list below MUST stay in sync with constants.ts ANIMAL_CONFIGS,
-- DELIVERY_CHARGE, and SLAUGHTER_FEE (it mirrors utils/pricing.ts).

CREATE OR REPLACE FUNCTION compute_order_pricing(
  p_animal_type  TEXT,
  p_quantity     INT,
  p_skin_option  TEXT,
  p_shares       INT,
  p_bag_size     TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  c_delivery       NUMERIC := 35;   -- DELIVERY_CHARGE
  c_slaughter      NUMERIC := 20;   -- SLAUGHTER_FEE
  v_unit           NUMERIC;
  v_qty            INT := GREATEST(COALESCE(p_quantity, 1), 1);
  v_shares         INT := GREATEST(COALESCE(p_shares, 1), 1);
  v_subtotal       NUMERIC;
  v_slaughter_fee  NUMERIC := 0;
  v_total          NUMERIC;
  v_per_share      NUMERIC;
BEGIN
  v_unit := CASE p_animal_type
    WHEN 'Goat'    THEN 479
    WHEN 'Cow'     THEN 1800
    WHEN 'Chicken' THEN 15
    WHEN 'Goat Meat' THEN CASE p_bag_size
      WHEN '2 lb' THEN 24 WHEN '5 lb' THEN 60 WHEN '10 lb' THEN 120 ELSE 24 END
    WHEN 'Cow Skin' THEN CASE p_bag_size
      WHEN '2 lb' THEN 24 WHEN '5 lb' THEN 60 ELSE 24 END
    ELSE NULL
  END;

  IF v_unit IS NULL THEN
    RAISE EXCEPTION 'Unknown product type: %', p_animal_type;
  END IF;

  v_subtotal := v_unit * v_qty;

  IF p_skin_option = 'BURNT' THEN
    v_slaughter_fee := CASE WHEN p_animal_type = 'Chicken' THEN c_slaughter * v_qty ELSE c_slaughter END;
  END IF;

  v_total := v_subtotal + v_slaughter_fee + c_delivery;
  v_per_share := CASE WHEN v_shares > 1 THEN ROUND(v_total / v_shares, 2) ELSE v_total END;

  RETURN jsonb_build_object(
    'animalSubtotal', v_subtotal,
    'slaughterFee',   v_slaughter_fee,
    'deliveryCharge', c_delivery,
    'totalPrice',     v_total,
    'perShareAmount', v_per_share
  );
END;
$$;

-- Trigger: on every order insert, recompute pricing server-side and overwrite
-- the client-supplied pricing + each portion owner's amount.
CREATE OR REPLACE FUNCTION enforce_order_pricing() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_pricing   JSONB;
  v_per_share NUMERIC;
BEGIN
  v_pricing := compute_order_pricing(NEW.animal_type, NEW.quantity, NEW.skin_option, NEW.shares, NEW.bag_size);
  v_per_share := (v_pricing->>'perShareAmount')::NUMERIC;

  NEW.pricing := v_pricing;

  -- Every share is equal; set each owner's amount to the authoritative value so
  -- co-buyer charges (pay-share reads owner.amount) can't be tampered with.
  NEW.portion_owners := (
    SELECT COALESCE(jsonb_agg(elem || jsonb_build_object('amount', v_per_share)), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(NEW.portion_owners, '[]'::jsonb)) AS elem
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_pricing ON orders;
CREATE TRIGGER trg_enforce_order_pricing
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_order_pricing();
