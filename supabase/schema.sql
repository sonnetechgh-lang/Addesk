-- Supabase Schema for Sonnet AdDesk

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique not null,
  email text not null,
  phone text,
  bio text,
  profile_photo_url text,
  instagram_handle text,
  tiktok_handle text,
  twitter_handle text,
  paystack_subaccount_code text,
  is_onboarded boolean default false,
  created_at timestamptz default now()
);

-- Turn on RLS for profiles
alter table public.profiles enable row level security;

-- RLS Policies for Profiles
-- Anyone can view a profile (for the public booking page)
create policy "Public profiles are viewable by everyone." 
  on profiles for select using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile." 
  on profiles for insert with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile." 
  on profiles for update using (auth.uid() = id);


-- 2. Packages Table
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price integer not null, -- stored in pesewas
  delivery_days integer not null default 3,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Turn on RLS for packages
alter table public.packages enable row level security;

-- RLS Policies for Packages
-- Anyone can view active packages
create policy "Packages are viewable by everyone." 
  on packages for select using (true);

-- Influencers can insert their own packages
create policy "Influencers can insert their own packages." 
  on packages for insert with check (auth.uid() = influencer_id);

-- Influencers can update their own packages
create policy "Influencers can update their own packages." 
  on packages for update using (auth.uid() = influencer_id);

-- Influencers can delete their own packages
create policy "Influencers can delete their own packages." 
  on packages for delete using (auth.uid() = influencer_id);


-- 3. Orders Table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  client_business_name text not null,
  product_description text not null,
  target_audience text,
  preferred_dates text,
  asset_urls text[], -- Supabase Storage URLs
  influencer_id uuid references public.profiles(id) not null,
  package_id uuid references public.packages(id) not null,
  amount integer not null, -- total in pesewas
  platform_fee integer not null, -- your cut in pesewas
  influencer_amount integer not null, -- influencer's share in pesewas
  paystack_reference text,
  payment_status text default 'pending', -- pending | paid | failed
  order_status text default 'new', -- new | in_progress | submitted | live | completed | cancelled
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Turn on RLS for orders
alter table public.orders enable row level security;

-- RLS Policies for Orders
-- Influencers can view their own orders
create policy "Influencers can view their own orders." 
  on orders for select using (auth.uid() = influencer_id);

-- Influencers can update their own orders (specifically status and notes)
create policy "Influencers can update their own orders." 
  on orders for update using (auth.uid() = influencer_id);

-- Note: Order insertion is handled by the webhook (Service Role), so no public insert policy is needed.


-- 4. Storage Buckets
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict do nothing;

insert into storage.buckets (id, name, public) 
values ('orders', 'orders', true)
on conflict do nothing;

-- Storage RLS: Avatars
create policy "Avatar images are publicly accessible." 
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." 
  on storage.objects for insert with check (bucket_id = 'avatars');

-- Storage RLS: Orders (Client Uploads via public form)
create policy "Order assets are publicly accessible." 
  on storage.objects for select using (bucket_id = 'orders');

create policy "Anyone can upload order assets." 
  on storage.objects for insert with check (bucket_id = 'orders');


-- 5. Trigger for new auth users
-- When a user signs up, automatically create a row in the profiles table
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, username)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    -- Simple slugification for initial username, can be changed during onboarding
    lower(regexp_replace(new.raw_user_meta_data->>'full_name', '\s+', '', 'g')) || '_' || substr(md5(random()::text), 1, 4)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
