-- Replace hardcoded-email admin policies with app_metadata.role-based check.
-- To grant admin: run in Supabase dashboard using service role:
--   UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
--   WHERE email = 'your@email.com';

DROP POLICY IF EXISTS "Admins read all orders" ON orders;
DROP POLICY IF EXISTS "Admins update all orders" ON orders;

CREATE POLICY "Admins read all orders"
  ON orders FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins update all orders"
  ON orders FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
