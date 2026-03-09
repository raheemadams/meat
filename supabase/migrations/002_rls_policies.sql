-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ─── User policies ───────────────────────────────────────────────────────────

-- Users can read their own orders
CREATE POLICY "Users read own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert orders with their own user_id
CREATE POLICY "Users insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (needed for PayMyShare flow)
CREATE POLICY "Users update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── Admin policies ──────────────────────────────────────────────────────────
-- Admins are identified by their email stored in VITE_ADMIN_EMAIL.
-- For the SQL policy, hardcode admin emails here (update as needed):

CREATE POLICY "Admins read all orders"
  ON orders FOR SELECT
  USING (
    lower((auth.jwt() ->> 'email')::text) = ANY(ARRAY[
      'admin@halalmeats.com'
      -- Add more admin emails here, e.g.:
      -- 'manager@halalmeats.com'
    ])
  );

CREATE POLICY "Admins update all orders"
  ON orders FOR UPDATE
  USING (
    lower((auth.jwt() ->> 'email')::text) = ANY(ARRAY[
      'admin@halalmeats.com'
      -- Add more admin emails here
    ])
  );

-- ─── NOTE on PayMyShare (unauthenticated payment links) ─────────────────────
-- The PayMyShare page allows secondary participants to pay without logging in.
-- Their payment updates (marking isPaid=true on portion_owners) should go through
-- a Supabase Edge Function using the service role key, which bypasses RLS safely.
-- Do NOT add a blanket anon UPDATE policy here.
