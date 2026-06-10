-- Pre-launch cleanup: remove all accounts except the admin emails.
-- Deleting from auth.users cascades to the user's orders, sessions, and identities.

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM auth.users
   WHERE lower(email) NOT IN ('raheemadams@gmail.com', 'info@halaliy.com');
  RAISE NOTICE 'Deleting % non-admin account(s)', n;
END $$;

DELETE FROM auth.users
 WHERE lower(email) NOT IN ('raheemadams@gmail.com', 'info@halaliy.com');
