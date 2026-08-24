-- Switch patron_orders from Shopier (buyer PII collected upfront) to Lemon
-- Squeezy (buyer info collected on their hosted checkout, returned via
-- webhook instead).
alter table public.patron_orders drop column if exists buyer_phone;
alter table public.patron_orders alter column buyer_name drop not null;
alter table public.patron_orders alter column buyer_email drop not null;
alter table public.patron_orders add column if not exists provider_order_id text;
