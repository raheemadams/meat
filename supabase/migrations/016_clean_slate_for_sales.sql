-- Clean slate before sales: clear all orders and all non-admin accounts.
-- (Keeps only the admin emails. Deleting users cascades to their orders too.)

DO $$
DECLARE n_orders integer; n_users integer;
BEGIN
  SELECT count(*) INTO n_orders FROM orders;
  SELECT count(*) INTO n_users FROM auth.users
   WHERE lower(email) NOT IN ('raheemadams@gmail.com', 'info@halaliy.com');
  RAISE NOTICE 'Clearing % order(s) and % non-admin account(s)', n_orders, n_users;
END $$;

TRUNCATE TABLE orders;

DELETE FROM auth.users
 WHERE lower(email) NOT IN ('raheemadams@gmail.com', 'info@halaliy.com');
