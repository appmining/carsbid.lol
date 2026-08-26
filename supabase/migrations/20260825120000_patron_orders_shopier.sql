-- Shopier's classic checkout API requires buyer phone upfront (unlike
-- iyzico/Lemon Squeezy, which collect it on their own hosted page) — restore
-- the column dropped in 20260823161500_patron_orders_lemonsqueezy.sql.
alter table public.patron_orders add column if not exists buyer_phone text;
