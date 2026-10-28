-- Blood Donor Directory and Emergency Request System
-- Run this whole script in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(80) not null check (char_length(trim(full_name)) >= 2),
  email varchar(254) not null unique,
  phone varchar(20) not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.donor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.app_users(id) on delete cascade,
  blood_group varchar(3) not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  city varchar(80) not null,
  phone varchar(20) not null,
  available boolean not null default true,
  last_donation_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emergency_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null constraint emergency_requests_requester_id_fkey references public.app_users(id) on delete cascade,
  patient_name varchar(80) not null,
  blood_group varchar(3) not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_needed integer not null check (units_needed between 1 and 10),
  hospital varchar(120) not null,
  city varchar(80) not null,
  contact_phone varchar(20) not null,
  needed_by timestamptz not null,
  notes varchar(500),
  status varchar(12) not null default 'open' check (status in ('open','fulfilled','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists donor_profiles_search_idx on public.donor_profiles (blood_group, city, available);
create index if not exists emergency_requests_status_created_idx on public.emergency_requests (status, created_at desc);
create index if not exists emergency_requests_blood_city_idx on public.emergency_requests (blood_group, city);
create index if not exists emergency_requests_requester_idx on public.emergency_requests (requester_id);
drop trigger if exists donor_profiles_updated_at on public.donor_profiles;
create trigger donor_profiles_updated_at before update on public.donor_profiles for each row execute function public.set_updated_at();

-- RLS is enabled to block direct access from browser clients. The application accesses
-- tables only through its authenticated Express API using a server-only service key.
alter table public.app_users enable row level security;
alter table public.donor_profiles enable row level security;
alter table public.emergency_requests enable row level security;
