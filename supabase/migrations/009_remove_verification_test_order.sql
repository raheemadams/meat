-- Cleanup: remove the single end-to-end verification order (ORD-TEST0001)
-- created while confirming the flow works on the freshly-cleared DB.
DELETE FROM orders WHERE id = 'ORD-TEST0001';
