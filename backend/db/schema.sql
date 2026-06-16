create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('buyer', 'seller', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kyc_status as enum ('pending', 'submitted', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type car_status as enum ('draft', 'pending', 'active', 'reserved', 'sold', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  state text not null,
  active boolean not null default true,
  car_count integer not null default 0,
  inspection_centers integer not null default 0,
  avg_price_lakh numeric(10,2) not null default 0,
  lat numeric(10,6),
  lng numeric(10,6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  phone text unique,
  password_hash text,
  role user_role not null default 'buyer',
  kyc_status kyc_status not null default 'pending',
  avatar_url text,
  city_id uuid references cities(id),
  is_verified boolean not null default false,
  wallet_balance_paise bigint not null default 0,
  google_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references users(id),
  city_id uuid not null references cities(id),
  make text not null,
  model text not null,
  variant text,
  year integer not null check (year between 2005 and 2030),
  price_paise bigint not null check (price_paise > 0),
  km_driven integer not null default 0,
  fuel_type text not null,
  transmission text not null,
  owner_count integer not null default 1,
  body_type text,
  color text,
  registration_number text unique,
  status car_status not null default 'pending',
  quality_score integer not null default 0 check (quality_score between 0 and 100),
  fraud_score integer not null default 0 check (fraud_score between 0 and 100),
  description text,
  primary_image_url text,
  moderation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists car_images (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  url text not null,
  position integer not null default 1,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  inspector_id uuid references users(id),
  status text not null default 'scheduled',
  scheduled_at timestamptz,
  completed_at timestamptz,
  score integer not null default 0 check (score between 0 and 100),
  summary text,
  share_token text unique,
  created_at timestamptz not null default now()
);

create table if not exists inspection_checklist_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  category text not null,
  item_name text not null,
  condition text not null,
  notes text,
  photo_url text,
  annotation_json jsonb not null default '{}'::jsonb
);

create table if not exists inspection_bookings (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references users(id),
  seller_id uuid references users(id),
  car_id uuid not null references cars(id),
  inspector_id uuid references users(id),
  status text not null default 'confirmed',
  scheduled_at timestamptz not null,
  slot text,
  address text not null,
  lat numeric(10,6),
  lng numeric(10,6),
  tracking_token text unique,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  car_id uuid references cars(id),
  amount_paise bigint not null,
  method text not null,
  gateway text not null default 'razorpay',
  gateway_order_id text,
  gateway_payment_id text,
  escrow_status text not null default 'held',
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  car_id uuid not null references cars(id),
  buyer_id uuid not null references users(id),
  seller_id uuid not null references users(id),
  token_payment_id uuid references payments(id),
  full_payment_id uuid references payments(id),
  amount_paise bigint not null,
  status text not null default 'reserved',
  delivery_date date,
  rc_transfer_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references users(id),
  car_id uuid references cars(id),
  seller_id uuid references users(id),
  rating integer not null check (rating between 1 and 5),
  text text,
  created_at timestamptz not null default now()
);

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references users(id),
  car_id uuid not null references cars(id),
  created_at timestamptz not null default now(),
  unique (buyer_id, car_id)
);

create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references users(id),
  name text not null,
  filters_json jsonb not null default '{}'::jsonb,
  alert_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  type text not null,
  title text not null,
  message text not null,
  action_url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  category text not null,
  subject text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_rooms (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references users(id),
  seller_id uuid not null references users(id),
  car_id uuid not null references cars(id),
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references chat_rooms(id) on delete cascade,
  sender_id uuid not null references users(id),
  content text not null,
  type text not null default 'text',
  offer_amount_paise bigint,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_cars_make_model_year on cars(make, model, year);
create index if not exists idx_cars_status_created on cars(status, created_at desc);
create index if not exists idx_cars_seller_status on cars(seller_id, status);
create index if not exists idx_cars_city_status on cars(city_id, status);
create index if not exists idx_orders_buyer on orders(buyer_id, created_at desc);
create index if not exists idx_orders_seller on orders(seller_id, created_at desc);
create index if not exists idx_notifications_user_read on notifications(user_id, read, created_at desc);