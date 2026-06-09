-- Add raheemadams@gmail.com as a second admin alongside info@halaliy.com.
-- Recreate the admin SELECT/UPDATE policies with both admin emails.

DROP POLICY IF EXISTS "Admins read all orders" ON orders;
DROP POLICY IF EXISTS "Admins update all orders" ON orders;

CREATE POLICY "Admins read all orders"
  ON orders FOR SELECT
  USING (
    lower((auth.jwt() ->> 'email')::text) = ANY(ARRAY[
      'info@halaliy.com',
      'raheemadams@gmail.com'
    ])
  );

CREATE POLICY "Admins update all orders"
  ON orders FOR UPDATE
  USING (
    lower((auth.jwt() ->> 'email')::text) = ANY(ARRAY[
      'info@halaliy.com',
      'raheemadams@gmail.com'
    ])
  );
