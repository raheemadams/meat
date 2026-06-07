-- Add bag_size column to store the selected weight for bagged products (e.g. '2 lb', '5 lb')
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bag_size TEXT;
