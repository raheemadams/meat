-- Cleanup: remove the order-first checkout verification order + throwaway user.
DELETE FROM orders WHERE id = 'ORD-CARDTEST';
DELETE FROM auth.users WHERE lower(email) = 'cardtest@halaliy.com';
