-- Dapur Kita initial schema. Run in Supabase SQL Editor or via Supabase migrations.
create extension if not exists pgcrypto;
create type public.user_role as enum ('customer','admin');
create type public.payment_method as enum ('qris','gopay','bank_transfer','cod');
create type public.payment_status as enum ('pending','paid','failed','expired','refunded');
create type public.order_status as enum ('awaiting_payment','confirmed','processing','shipped','completed','cancelled');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', phone text,
 role public.user_role not null default 'customer',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 description text, image_url text, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.products (
 id uuid primary key default gen_random_uuid(), category_id uuid references public.categories(id) on delete set null,
 name text not null, slug text not null unique, description text not null default '',
 price numeric(12,0) not null check (price >= 0), stock integer not null default 0 check (stock >= 0),
 image_url text, is_available boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.product_variants (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 variant_name text not null, additional_price numeric(12,0) not null default 0 check (additional_price >= 0),
 stock integer not null default 0 check (stock >= 0), is_available boolean not null default true
);
create table public.addresses (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 recipient_name text not null, phone text not null, address_line text not null, district text, city text not null, postal_code text,
 is_default boolean not null default false, created_at timestamptz not null default now()
);
create table public.carts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.cart_items (
 id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete restrict,
 variant_id uuid references public.product_variants(id) on delete set null,
 quantity integer not null check (quantity > 0), created_at timestamptz not null default now(), unique(cart_id,product_id,variant_id)
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), order_number text not null unique,
 user_id uuid not null references auth.users(id) on delete restrict,
 recipient_name text not null, recipient_phone text not null, shipping_address_snapshot jsonb not null,
 notes text, subtotal numeric(12,0) not null check (subtotal >= 0),
 discount_percentage numeric(5,2) not null default 0 check(discount_percentage between 0 and 100),
 discount_amount numeric(12,0) not null default 0 check(discount_amount >= 0),
 shipping_cost numeric(12,0) not null default 0 check(shipping_cost >= 0),
 total_amount numeric(12,0) not null check (total_amount >= 0),
 payment_method public.payment_method not null, payment_status public.payment_status not null default 'pending',
 order_status public.order_status not null default 'awaiting_payment',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
 product_id uuid references public.products(id) on delete set null,
 product_name_snapshot text not null, product_image_snapshot text, variant_snapshot text,
 unit_price numeric(12,0) not null check(unit_price >= 0), quantity integer not null check(quantity > 0),
 line_total numeric(12,0) not null check(line_total >= 0), created_at timestamptz not null default now()
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
 provider text not null, provider_transaction_id text unique, payment_method public.payment_method not null,
 amount numeric(12,0) not null check(amount >= 0), status public.payment_status not null default 'pending',
 expires_at timestamptz, paid_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payment_webhook_events (
 id uuid primary key default gen_random_uuid(), provider text not null, event_id text not null,
 processed_at timestamptz, processing_status text not null default 'received', created_at timestamptz not null default now(),
 unique(provider,event_id)
);
create table public.promotions (
 id uuid primary key default gen_random_uuid(), name text not null,
 discount_percentage numeric(5,2) not null check(discount_percentage between 0 and 100),
 minimum_item_quantity integer not null default 3 check(minimum_item_quantity >= 1),
 starts_at timestamptz, ends_at timestamptz, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.store_settings (
 id integer primary key default 1 check(id=1), store_name text not null default 'Dapur Kita', logo_url text,
 contact_phone text, contact_email text, address text, opening_hours jsonb not null default '{}'::jsonb,
 cod_enabled boolean not null default true, shipping_settings jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);

create index products_category_idx on public.products(category_id);
create index products_available_idx on public.products(is_available) where is_available=true;
create index orders_user_created_idx on public.orders(user_id,created_at desc);
create index orders_status_idx on public.orders(order_status,payment_status);
create index order_items_order_idx on public.order_items(order_id);
create index payments_order_idx on public.payments(order_id);
create index addresses_user_idx on public.addresses(user_id);

-- New users always get a customer profile; users cannot set their own role through metadata.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.promotions enable row level security;
alter table public.store_settings enable row level security;

create policy "profiles read own or admin" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "profiles update own or admin" on public.profiles for update using (id=auth.uid() or public.is_admin()) with check (id=auth.uid() or public.is_admin());
create policy "public read active categories" on public.categories for select using (is_active or public.is_admin());
create policy "admin manage categories" on public.categories for all using(public.is_admin()) with check(public.is_admin());
create policy "public read available products" on public.products for select using(is_available or public.is_admin());
create policy "admin manage products" on public.products for all using(public.is_admin()) with check(public.is_admin());
create policy "read available variants" on public.product_variants for select using(is_available or public.is_admin());
create policy "admin manage variants" on public.product_variants for all using(public.is_admin()) with check(public.is_admin());
create policy "addresses owner or admin" on public.addresses for all using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy "carts owner or admin" on public.carts for all using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy "cart items through owned cart" on public.cart_items for all using(exists(select 1 from public.carts c where c.id=cart_id and (c.user_id=auth.uid() or public.is_admin()))) with check(exists(select 1 from public.carts c where c.id=cart_id and (c.user_id=auth.uid() or public.is_admin())));
create policy "orders owner or admin read" on public.orders for select using(user_id=auth.uid() or public.is_admin());
create policy "orders owner create" on public.orders for insert with check(user_id=auth.uid());
create policy "admin updates orders" on public.orders for update using(public.is_admin()) with check(public.is_admin());
create policy "order items owner or admin read" on public.order_items for select using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy "payments owner or admin read" on public.payments for select using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy "admin manages payments" on public.payments for all using(public.is_admin()) with check(public.is_admin());
create policy "admin manages webhook events" on public.payment_webhook_events for all using(public.is_admin()) with check(public.is_admin());
create policy "public read active promotions" on public.promotions for select using(is_active or public.is_admin());
create policy "admin manages promotions" on public.promotions for all using(public.is_admin()) with check(public.is_admin());
create policy "public read store settings" on public.store_settings for select using(true);
create policy "admin manages store settings" on public.store_settings for all using(public.is_admin()) with check(public.is_admin());

insert into public.categories(name,slug,description) values
('Makanan berat','makanan-berat','Menu utama yang mengenyangkan'),('Minuman','minuman','Minuman segar dan kopi'),('Camilan','camilan','Teman santai kapan saja'),('Dessert','dessert','Penutup manis favorit') on conflict(slug) do nothing;
insert into public.products(category_id,name,slug,description,price,stock,image_url) values
((select id from public.categories where slug='makanan-berat'),'Nasi Ayam Sambal Matah','nasi-ayam-sambal-matah','Nasi hangat dengan ayam dan sambal matah segar.',22000,25,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85'),
((select id from public.categories where slug='makanan-berat'),'Burger Dapur Spesial','burger-dapur-spesial','Burger gurih dengan sayuran segar.',28000,20,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85'),
((select id from public.categories where slug='minuman'),'Es Kopi Susu Gula Aren','es-kopi-susu-gula-aren','Kopi susu dingin dengan gula aren.',16000,30,'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85'),
((select id from public.categories where slug='dessert'),'Pancake Buah Madu','pancake-buah-madu','Pancake lembut dengan buah dan madu.',24000,15,'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=85') on conflict(slug) do nothing;
insert into public.promotions(name,discount_percentage,minimum_item_quantity,is_active) values('Promo 3 item',5,3,true);
insert into public.store_settings(id,store_name) values(1,'Dapur Kita') on conflict(id) do nothing;

-- IMPORTANT: Do not make a user admin from client-side metadata. After verifying the intended account,
-- promote it manually in the Supabase SQL editor using its auth user UUID:
-- update public.profiles set role='admin' where id='UUID-AKUN-TERVERIFIKASI';
