-- Harden order security: remove the broad customer UPDATE policy.
-- Previously a logged-in customer could update ANY column on their own order
-- (price, status, portion_owners, etc.) directly via the API. All legitimate
-- order mutations now go through:
--   • Admins  → the "Admins update all orders" policy
--   • Co-buyer payments → the pay-share edge function (service role, bypasses RLS)
--   • Cancellations     → the cancel-order edge function (service role)
-- Customers no longer need (or get) direct UPDATE access.

DROP POLICY IF EXISTS "Users update own orders" ON orders;
