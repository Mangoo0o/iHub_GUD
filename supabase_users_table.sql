-- Users table for User Management
-- Run this in the Supabase SQL Editor to create the users table

-- Drop table if exists (safe to run multiple times)
drop table if exists public.users cascade;

-- Create users table
create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text, -- Store hashed password (use bcrypt or similar in production)
  user_level text not null default 'assistant' check (user_level in ('admin', 'assistant')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster lookups
create index idx_users_email on public.users(email);
create index idx_users_username on public.users(username);
create index idx_users_is_active on public.users(is_active);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Allow read users" on public.users;
drop policy if exists "Allow insert users" on public.users;
drop policy if exists "Allow update users" on public.users;
drop policy if exists "Allow delete users" on public.users;

-- Create policies (adjust based on your security needs)
-- For now, allowing all operations - you may want to restrict this based on user_level
create policy "Allow read users" on public.users for select using (true);
create policy "Allow insert users" on public.users for insert with check (true);
create policy "Allow update users" on public.users for update using (true);
create policy "Allow delete users" on public.users for delete using (true);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_users_updated_at
  before update on public.users
  for each row
  execute function update_updated_at_column();

-- Insert default admin user (password should be hashed in production)
-- Note: In production, use Supabase Auth or hash passwords properly
insert into public.users (username, email, password_hash, user_level, is_active) values
('admin', 'admin@ihub.dost.gov.ph', '$2a$10$placeholder_hash_replace_in_production', 'admin', true)
on conflict (username) do nothing;

comment on table public.users is 'User accounts for the dashboard system';
comment on column public.users.password_hash is 'Hashed password - use bcrypt or similar. In production, consider using Supabase Auth instead.';
comment on column public.users.user_level is 'User access level: admin or assistant';
