-- One-time data reset: clear all orders for a fresh start (test data wipe).
-- Safe to keep in history: it only re-runs on a brand-new DB (where orders is
-- already empty). On the live DB it is recorded as applied and never re-runs.

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM orders;
  RAISE NOTICE 'Clearing % order(s) for a fresh start', n;
END $$;

TRUNCATE TABLE orders;
