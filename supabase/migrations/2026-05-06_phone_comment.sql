-- Adds phone (collected on the order page) and comment (collected on the
-- thank-you page) to orders. Safe to re-run.

alter table orders
  add column if not exists phone   text,
  add column if not exists comment text;

create index if not exists orders_phone_idx on orders (phone);
