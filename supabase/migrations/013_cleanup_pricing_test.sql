-- Cleanup: remove the pricing-enforcement verification order + throwaway user.
DELETE FROM orders WHERE id = 'ORD-TAMPER01';
DELETE FROM auth.users WHERE lower(email) = 'pricetest@halaliy.com';
