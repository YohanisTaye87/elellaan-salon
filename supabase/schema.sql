-- ============================================================================
-- Elellaan Salon — schema + seed
-- Run this once in Supabase SQL Editor (or via `supabase db reset`).
-- ============================================================================

-- ---------- tables ----------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists services (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name        text not null,
  price_min   int  not null check (price_min >= 0),
  price_max   int            check (price_max is null or price_max >= price_min),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists services_category_idx on services(category_id);

create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  customer_name text,
  total         int  not null check (total >= 0),
  created_at    timestamptz not null default now()
);

create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  service_id    uuid          references services(id) on delete set null,
  service_name  text not null,
  category_name text not null,
  price         int  not null check (price >= 0)
);
create index if not exists order_items_order_idx on order_items(order_id);

-- ---------- row level security ----------
-- The customer (anon) can READ services + categories and INSERT orders.
-- Admin operations are routed through API routes that use the service-role key,
-- so we lock down everything else for `anon`.
alter table categories  enable row level security;
alter table services    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

drop policy if exists "anon read categories"  on categories;
drop policy if exists "anon read services"    on services;
drop policy if exists "anon insert orders"    on orders;
drop policy if exists "anon insert order_items" on order_items;

create policy "anon read categories"
  on categories for select to anon using (true);

create policy "anon read services"
  on services for select to anon using (true);

create policy "anon insert orders"
  on orders for insert to anon with check (true);

create policy "anon insert order_items"
  on order_items for insert to anon with check (true);

-- ============================================================================
-- Seed data — pulled from the printed price list.
-- Safe to re-run: existing rows with the same (category, name) are skipped.
-- ============================================================================

insert into categories (name, sort_order) values
  ('Shuruba Ye Eje',    10),
  ('Wig',               20),
  ('Makeup',            30),
  ('Hair Styling',      40),
  ('Ponitel',           50),
  ('Hair Extension',    60),
  ('Hair Coloring',     70),
  ('Eyelash Extension', 80),
  ('Nail',              90),
  ('Henna',            100),
  ('Waxing',           110),
  ('Body Care',        120),
  ('Hair Cut',         130),
  ('Washing',          140),
  ('Steam',            150),
  ('Treatment',        160),
  ('Kendeb',           170)
on conflict (name) do nothing;

-- helper: insert a service if it does not already exist for that category
do $$
declare
  v jsonb := $j$
  [
    {"cat":"Shuruba Ye Eje","items":[
      ["Kutitir",400,null,10],
      ["Tedros",250,null,20],
      ["Half Shuruba Half Kuterter",400,null,30],
      ["Half Shuruba Half Sifet",1000,null,40],
      ["Shuruba Meftat",200,null,50],
      ["Ye Tigre Shuruba",400,null,60]
    ]},
    {"cat":"Wig","items":[
      ["Ye Kenya Wig",250,null,10],
      ["Ye Tigre Wig",700,null,20],
      ["Boho",1000,null,30],
      ["Like Human",3500,6000,40],
      ["Ye Sefet Wig",3500,null,50]
    ]},
    {"cat":"Makeup","items":[
      ["Simple Makeup",2000,null,10],
      ["Soft Glam",4000,null,20],
      ["Glam",7000,null,30]
    ]},
    {"cat":"Hair Styling","items":[
      ["Wev",400,null,10],
      ["Pystra",400,null,20],
      ["Pablis",400,null,30],
      ["SabSab",400,null,40],
      ["Kaks",300,null,50],
      ["Spring",400,null,60],
      ["Hair Refreshment",300,null,70],
      ["Human Hair Curling",250,null,80]
    ]},
    {"cat":"Ponitel","items":[
      ["Normal Ponitel",500,null,10],
      ["Half Ponitel Half Sifet",1300,null,20],
      ["Kaks, Ponitel, Sifet",2000,null,30]
    ]},
    {"cat":"Hair Extension","items":[
      ["Sigsig",1000,null,10],
      ["Normal Sefet",800,null,20],
      ["Sefet With Paustera",1200,null,30],
      ["SigSig With Paystra",1400,null,40]
    ]},
    {"cat":"Hair Coloring","items":[
      ["Hair Coloring",5000,7000,10]
    ]},
    {"cat":"Eyelash Extension","items":[
      ["One by One",2000,null,10],
      ["3D",1500,null,20],
      ["Normal Eyelash",1000,null,30]
    ]},
    {"cat":"Nail","items":[
      ["Gel",1000,null,10],
      ["Gel with Design",1500,null,20],
      ["Extension",800,null,30],
      ["Refill",800,null,40],
      ["Shilak",500,null,50],
      ["Polish",250,null,60],
      ["Extension with Shilak",1000,null,70],
      ["Extension with Normal Polish",600,null,80]
    ]},
    {"cat":"Henna","items":[
      ["One Hand",250,null,10],
      ["Two Hand",500,null,20],
      ["Eyebrow",200,null,30],
      ["Henna and Mesh",300,null,40],
      ["Two Leg",500,null,50],
      ["Henna with Glue",700,null,60],
      ["Glue Design",700,null,70]
    ]},
    {"cat":"Waxing","items":[
      ["Eyebrow & Lip",250,null,10],
      ["Eyebrow, Lip & Chin",300,null,20],
      ["Full Leg",1000,null,30],
      ["Full Body",2000,null,40],
      ["Bikini",1000,null,50]
    ]},
    {"cat":"Body Care","items":[
      ["Pedicure",500,null,10],
      ["Manicure",500,null,20]
    ]},
    {"cat":"Hair Cut","items":[
      ["Hair Cut",200,800,10]
    ]},
    {"cat":"Washing","items":[
      ["Hair Washing",200,null,10],
      ["Hair Washing + Shampoo + Conditioner",300,null,20],
      ["Human Hair + Conditioner",300,null,30],
      ["Kebe Metateb",300,null,40]
    ]},
    {"cat":"Steam","items":[
      ["Face Steam",500,null,10],
      ["Hair Steam",500,null,20],
      ["Without Treatment",300,null,30]
    ]},
    {"cat":"Treatment","items":[
      ["Shampoo",50,null,10],
      ["Conditioner",50,null,20],
      ["Hair Mask",250,null,30],
      ["Hot Oil",200,null,40]
    ]},
    {"cat":"Kendeb","items":[
      ["Be Melac",100,null,10],
      ["Be Ker",150,null,20],
      ["Be Wax",200,null,30]
    ]}
  ]
  $j$;
  cat_rec  jsonb;
  item_rec jsonb;
  cat_id   uuid;
begin
  for cat_rec in select * from jsonb_array_elements(v) loop
    select id into cat_id from categories where name = cat_rec->>'cat';
    if cat_id is null then
      raise notice 'category not found: %', cat_rec->>'cat';
      continue;
    end if;
    for item_rec in select * from jsonb_array_elements(cat_rec->'items') loop
      if not exists (
        select 1 from services
        where category_id = cat_id and name = item_rec->>0
      ) then
        insert into services (category_id, name, price_min, price_max, sort_order)
        values (
          cat_id,
          item_rec->>0,
          (item_rec->>1)::int,
          nullif(item_rec->>2,'null')::int,
          (item_rec->>3)::int
        );
      end if;
    end loop;
  end loop;
end $$;
