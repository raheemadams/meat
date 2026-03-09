-- Create the orders table for the Halal Meat Co. platform
CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_type      TEXT NOT NULL CHECK (animal_type IN ('Goat', 'Cow', 'Chicken')),
  quantity         INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  skin_option      TEXT NOT NULL DEFAULT 'NOT_BURNT' CHECK (skin_option IN ('BURNT', 'NOT_BURNT')),
  shares           INTEGER NOT NULL DEFAULT 1 CHECK (shares >= 1 AND shares <= 7),
  portion_owners   JSONB NOT NULL DEFAULT '[]',
  pricing          JSONB NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_date    DATE NOT NULL,
  delivery_window  TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'Confirmed',
  payment_method   TEXT NOT NULL CHECK (payment_method IN ('CARD', 'ZELLE')),
  zelle_ref_code   TEXT,
  admin_notes      TEXT,
  timestamp        BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user order lookups
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);

-- Index for admin status filtering
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

-- GIN index for JSONB portion_owners (enables token-based lookups)
CREATE INDEX IF NOT EXISTS orders_portion_owners_gin ON orders USING GIN(portion_owners);
