-- Rebrand: switch admin email used by RLS policies from the old domain to halaliy.com.
-- Recreate the admin SELECT/UPDATE policies with the new admin email.

DROP POLICY IF EXISTS "Admins read all orders" ON orders;
DROP POLICY IF EXISTS "Admins update all orders" ON orders;

CREATE POLICY "Admins read all orders"
  ON orders FOR SELECT
  USING (
    lower((auth.jwt() ->> 'email')::text) = ANY(ARRAY[
      'info@halaliy.com'
      -- Add more admin emails here, e.g.:
      -- 'manager@halaliy.com'
    ])
  );

CREATE POLICY "Admins update all orders"
  ON orders FOR UPDATE
  USING (
    lower((auth.jwt() ->> 'email')::text) = ANY(ARRAY[
      'info@halaliy.com'
      -- Add more admin emails here
    ])
  );
