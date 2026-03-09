-- Add subscription_interval column to orders table
-- NULL = one-time order, 1/2/3 = repeat every N months
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subscription_interval INTEGER
    CHECK (subscription_interval IN (1, 2, 3));
