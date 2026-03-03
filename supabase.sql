-- Chris TCG Booster Box - Supabase Schema (secure + guest-friendly)
-- Paste into Supabase SQL Editor and run once.

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1) Admin users
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_admin_only" on public.admin_users;
create policy "admin_users_select_admin_only"
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_users_write_admin_only" on public.admin_users;
create policy "admin_users_write_admin_only"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2) Products (public read, admin write)
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id bigserial primary key,
  name text not null,
  description text,
  features text[] not null default '{}',
  price numeric(12,2) not null default 0,
  lang text not null default 'Eng',
  series text not null default 'All Sets',
  image text,
  thumbnails text[] not null default '{}',
  in_stock boolean not null default true,
  rating numeric(3,2),
  reviews int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists features text[] not null default '{}';

create index if not exists products_series_idx on public.products(series);
create index if not exists products_lang_idx on public.products(lang);

alter table public.products enable row level security;

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "products_insert_public" on public.products;
drop policy if exists "products_insert_admin_only" on public.products;
create policy "products_insert_admin_only"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "products_update_public" on public.products;
drop policy if exists "products_update_admin_only" on public.products;
create policy "products_update_admin_only"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_delete_public" on public.products;
drop policy if exists "products_delete_admin_only" on public.products;
create policy "products_delete_admin_only"
on public.products
for delete
to authenticated
using (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'products_set_updated_at'
  ) then
    create trigger products_set_updated_at
    before update on public.products
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3) Favorites (works with anonymous auth user)
-- -----------------------------------------------------------------------------
create table if not exists public.favorites (
  user_id text not null,
  product_id bigint not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;
drop policy if exists "favorites_admin_all" on public.favorites;

alter table public.favorites drop constraint if exists favorites_user_id_fkey;
alter table public.favorites alter column user_id type text using user_id::text;
create index if not exists favorites_user_id_idx on public.favorites(user_id);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "favorites_admin_all" on public.favorites;
create policy "favorites_admin_all"
on public.favorites
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4) Cart items
-- -----------------------------------------------------------------------------
create table if not exists public.cart_items (
  user_id text not null,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

drop policy if exists "cart_select_own" on public.cart_items;
drop policy if exists "cart_insert_own" on public.cart_items;
drop policy if exists "cart_update_own" on public.cart_items;
drop policy if exists "cart_delete_own" on public.cart_items;
drop policy if exists "cart_admin_all" on public.cart_items;

alter table public.cart_items drop constraint if exists cart_items_user_id_fkey;
alter table public.cart_items alter column user_id type text using user_id::text;
create index if not exists cart_items_user_id_idx on public.cart_items(user_id);

alter table public.cart_items enable row level security;

drop policy if exists "cart_select_own" on public.cart_items;
create policy "cart_select_own"
on public.cart_items
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "cart_insert_own" on public.cart_items;
create policy "cart_insert_own"
on public.cart_items
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "cart_update_own" on public.cart_items;
create policy "cart_update_own"
on public.cart_items
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "cart_delete_own" on public.cart_items;
create policy "cart_delete_own"
on public.cart_items
for delete
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "cart_admin_all" on public.cart_items;
create policy "cart_admin_all"
on public.cart_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cart_items_set_updated_at'
  ) then
    create trigger cart_items_set_updated_at
    before update on public.cart_items
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5) Notification settings
-- -----------------------------------------------------------------------------
create table if not exists public.notification_settings (
  user_id text primary key,
  price_drop boolean not null default true,
  order_status boolean not null default true,
  new_arrivals boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop policy if exists "notif_settings_select_own" on public.notification_settings;
drop policy if exists "notif_settings_insert_own" on public.notification_settings;
drop policy if exists "notif_settings_update_own" on public.notification_settings;
drop policy if exists "notif_settings_admin_all" on public.notification_settings;

alter table public.notification_settings drop constraint if exists notification_settings_user_id_fkey;
alter table public.notification_settings alter column user_id type text using user_id::text;

alter table public.notification_settings enable row level security;

drop policy if exists "notif_settings_select_own" on public.notification_settings;
create policy "notif_settings_select_own"
on public.notification_settings
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "notif_settings_insert_own" on public.notification_settings;
create policy "notif_settings_insert_own"
on public.notification_settings
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "notif_settings_update_own" on public.notification_settings;
create policy "notif_settings_update_own"
on public.notification_settings
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "notif_settings_admin_all" on public.notification_settings;
create policy "notif_settings_admin_all"
on public.notification_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'notification_settings_set_updated_at'
  ) then
    create trigger notification_settings_set_updated_at
    before update on public.notification_settings
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) Orders + order_items
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('Processing','Shipped','Delivered','Cancelled');
  end if;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status public.order_status not null default 'Processing',

  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address text,

  subtotal numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0
);

drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_admin_all" on public.orders;

do $$
begin
  if to_regclass('public.order_items') is not null then
    execute 'drop policy if exists "order_items_insert_own" on public.order_items';
    execute 'drop policy if exists "order_items_select_own" on public.order_items';
    execute 'drop policy if exists "order_items_admin_all" on public.order_items';
  end if;
end;
$$;

alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders alter column user_id type text using user_id::text;
alter table public.orders alter column customer_name drop not null;
alter table public.orders alter column customer_email drop not null;
alter table public.orders alter column customer_phone drop not null;
alter table public.orders alter column shipping_address drop not null;

create table if not exists public.order_items (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id),
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0
);

alter table public.order_items add column if not exists unit_price numeric(12,2) not null default 0;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'order_items'
      and column_name = 'price_at_time'
  ) then
    execute 'update public.order_items set unit_price = coalesce(unit_price, price_at_time, 0)';
  end if;
end;
$$;

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
on public.orders
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
on public.orders
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
on public.order_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()::text
  )
);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()::text
  )
);

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all"
on public.order_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'orders_set_updated_at'
  ) then
    create trigger orders_set_updated_at
    before update on public.orders
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7) Chat (guest via Supabase anonymous auth, private per thread)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'message_sender') then
    create type public.message_sender as enum ('user','admin');
  end if;
end;
$$;

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  created_at timestamptz not null default now(),
  subject text,
  last_admin_read_at timestamptz,
  last_user_read_at timestamptz
);

drop policy if exists "chat_threads_insert_own" on public.chat_threads;
drop policy if exists "chat_threads_select_own" on public.chat_threads;
drop policy if exists "chat_threads_update_own" on public.chat_threads;
drop policy if exists "chat_threads_insert_anon" on public.chat_threads;
drop policy if exists "chat_threads_select_anon" on public.chat_threads;
drop policy if exists "chat_threads_admin_all" on public.chat_threads;

alter table public.chat_threads drop constraint if exists chat_threads_user_id_fkey;
alter table public.chat_threads alter column user_id type text using user_id::text;
alter table public.chat_threads add column if not exists last_admin_read_at timestamptz;
alter table public.chat_threads add column if not exists last_user_read_at timestamptz;
create index if not exists chat_threads_user_id_idx on public.chat_threads(user_id);

create table if not exists public.chat_messages (
  id bigserial primary key,
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  created_at timestamptz not null default now(),
  sender public.message_sender not null,
  body text not null
);

create index if not exists chat_messages_thread_id_idx on public.chat_messages(thread_id);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat_threads_insert_own" on public.chat_threads;
create policy "chat_threads_insert_own"
on public.chat_threads
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "chat_threads_select_own" on public.chat_threads;
create policy "chat_threads_select_own"
on public.chat_threads
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "chat_threads_update_own" on public.chat_threads;
create policy "chat_threads_update_own"
on public.chat_threads
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "chat_threads_insert_anon" on public.chat_threads;
drop policy if exists "chat_threads_select_anon" on public.chat_threads;

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
on public.chat_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.chat_threads t
    where t.id = chat_messages.thread_id
      and t.user_id = auth.uid()::text
  )
);

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
on public.chat_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_threads t
    where t.id = chat_messages.thread_id
      and t.user_id = auth.uid()::text
  )
);

drop policy if exists "chat_messages_insert_anon" on public.chat_messages;
drop policy if exists "chat_messages_select_anon" on public.chat_messages;

drop policy if exists "chat_threads_admin_all" on public.chat_threads;
create policy "chat_threads_admin_all"
on public.chat_threads
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "chat_messages_admin_all" on public.chat_messages;
create policy "chat_messages_admin_all"
on public.chat_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 8) Visitors tracking (public insert, admin read)
-- -----------------------------------------------------------------------------
create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  ip text not null default 'unknown',
  visit_date date not null default current_date,
  country text not null default 'unknown',
  city text not null default 'unknown',
  user_agent text,
  referrer text default 'direct',
  visited_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.visitors add column if not exists visit_date date not null default current_date;

-- Clean up any existing duplicates before creating the unique index
DELETE FROM public.visitors
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY ip, visit_date ORDER BY visited_at DESC) as rn
    FROM public.visitors
  ) t WHERE t.rn > 1
);

drop index if exists visitors_daily_unique_idx;
create unique index if not exists visitors_daily_unique_idx
on public.visitors (ip, visit_date);

alter table public.visitors enable row level security;

drop policy if exists "visitors_insert_public" on public.visitors;
create policy "visitors_insert_public"
on public.visitors
for insert
to anon, authenticated
with check (true);

drop policy if exists "visitors_select_admin" on public.visitors;
create policy "visitors_select_admin"
on public.visitors
for select
to authenticated
using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 9) Storage bucket for products (public read, admin write)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "products_bucket_public_read" on storage.objects;
create policy "products_bucket_public_read"
on storage.objects
for select
to public
using (bucket_id = 'products');

drop policy if exists "products_bucket_public_insert" on storage.objects;
drop policy if exists "products_bucket_admin_insert" on storage.objects;
create policy "products_bucket_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'products' and public.is_admin());

drop policy if exists "products_bucket_public_update" on storage.objects;
drop policy if exists "products_bucket_admin_update" on storage.objects;
create policy "products_bucket_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'products' and public.is_admin())
with check (bucket_id = 'products' and public.is_admin());

drop policy if exists "products_bucket_public_delete" on storage.objects;
drop policy if exists "products_bucket_admin_delete" on storage.objects;
create policy "products_bucket_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'products' and public.is_admin());

-- -----------------------------------------------------------------------------
-- 9b) Storage bucket for chat attachments (public read, authenticated write)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

drop policy if exists "chat_media_public_read" on storage.objects;
create policy "chat_media_public_read"
on storage.objects
for select
to public
using (bucket_id = 'chat-media');

drop policy if exists "chat_media_auth_insert" on storage.objects;
create policy "chat_media_auth_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'chat-media');

drop policy if exists "chat_media_auth_update" on storage.objects;
create policy "chat_media_auth_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'chat-media')
with check (bucket_id = 'chat-media');

drop policy if exists "chat_media_auth_delete" on storage.objects;
create policy "chat_media_auth_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'chat-media');

-- -----------------------------------------------------------------------------
-- 10) Sequence sync
-- -----------------------------------------------------------------------------
select setval('public.products_id_seq', (select coalesce(max(id), 0) from public.products) + 1, false);

-- -----------------------------------------------------------------------------
-- 11) Ensure shared admin account exists in admin_users (cross-device admin inbox)
-- -----------------------------------------------------------------------------
insert into public.admin_users (user_id)
select u.id
from auth.users u
where lower(u.email) = lower('kemzeugillesparfait@gmail.com')
on conflict (user_id) do nothing;
