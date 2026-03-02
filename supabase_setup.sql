-- CSF iHub – single Supabase setup script
-- Run this once in the Supabase SQL Editor. It creates everything the app needs:
--   registrations, evaluations, basic_info_fields, form_parts, questions, users.

-- 1) Remove obsolete objects
drop table if exists public.feedback_submissions cascade;
drop table if exists public.evaluation_answers cascade;
drop table if exists public.respondents cascade;
drop table if exists public.form_questions cascade;
drop table if exists public.evaluations cascade;
drop table if exists public.registrations cascade;

-- 2) Registrations table – Basic info (Part I)
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  parent_name text,
  sex text,
  country_code text,
  contact_number text,
  office_unit_address text,
  office_unit_other text,
  date_of_use date,
  children jsonb default '[]'::jsonb,  -- Array of children objects
  service_availed text,
  province text,
  city text,
  barangay text,
  created_at timestamptz default now()
);

alter table public.registrations enable row level security;
drop policy if exists "Allow anonymous insert" on public.registrations;
create policy "Allow anonymous insert" on public.registrations for insert with check (true);
drop policy if exists "Allow anonymous select" on public.registrations;
create policy "Allow anonymous select" on public.registrations for select using (true);
drop policy if exists "Allow anonymous update" on public.registrations;
create policy "Allow anonymous update" on public.registrations for update using (true);

-- 3) Evaluations table – Linked to Registration
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  answers jsonb default '{}'::jsonb,
  comments text,
  created_at timestamptz default now()
);

alter table public.evaluations enable row level security;
drop policy if exists "Allow anonymous insert" on public.evaluations;
create policy "Allow anonymous insert" on public.evaluations for insert with check (true);
drop policy if exists "Allow anonymous select" on public.evaluations;
create policy "Allow anonymous select" on public.evaluations for select using (true);

-- 4) Basic Information Fields – Metadata for Part I
create table if not exists public.basic_info_fields (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  sort_order int not null default 0,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'select', 'date', 'tel')),
  required boolean not null default false,
  created_at timestamptz default now()
);

alter table public.basic_info_fields enable row level security;
drop policy if exists "Allow read basic_info_fields" on public.basic_info_fields;
create policy "Allow read basic_info_fields" on public.basic_info_fields for select using (true);

insert into public.basic_info_fields (key, sort_order, label, field_type, required) values
('parent_name', 0, 'Name of Parent/Guardian', 'text', true),
('sex', 1, 'Sex', 'select', false),
('country_code', 2, 'Country Code', 'text', false),
('contact_number', 3, 'Contact Number', 'tel', true),
('office_unit_address', 4, 'Office/Unit/Address', 'select', false),
('office_unit_other', 5, 'Other (please specify)', 'text', false),
('children', 6, 'Children Information', 'text', false),
('date_of_use', 7, 'Date of Use', 'date', false)
on conflict (key) do update set
  sort_order = EXCLUDED.sort_order,
  label = EXCLUDED.label,
  field_type = EXCLUDED.field_type,
  required = EXCLUDED.required;

-- 5) Form parts (sections: Part II, Part III, etc.)
create table if not exists public.form_parts (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  sort_order int not null default 0,
  label text not null,
  created_at timestamptz default now()
);

alter table public.form_parts enable row level security;
drop policy if exists "Allow read form_parts" on public.form_parts;
create policy "Allow read form_parts" on public.form_parts for select using (true);

insert into public.form_parts (key, sort_order, label) values
('part2', 0, 'Part II – Facility and Service Evaluation'),
('part3', 1, 'Part III – Staff Evaluation'),
('part4', 2, 'Part IV – Overall Satisfaction')
on conflict (key) do update set
  sort_order = EXCLUDED.sort_order,
  label = EXCLUDED.label;

-- 6) Questions
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  part text not null,
  sort_order int not null default 0,
  key text not null unique,
  label text not null,
  answer_type text not null default 'emoji' check (answer_type in ('emoji', 'satisfaction', 'text', 'radio')),
  options jsonb,
  created_at timestamptz default now()
);

alter table public.questions enable row level security;
drop policy if exists "Allow read questions" on public.questions;
create policy "Allow read questions" on public.questions for select using (true);

insert into public.questions (part, sort_order, key, label, answer_type) values
('part2', 0, 'cleanliness_safety', 'Cleanliness and safety of the station', 'emoji'),
('part2', 1, 'child_comfort', 'Child''s comfort and enjoyment in the facility', 'emoji'),
('part2', 2, 'toys_materials', 'Availability and quality of toys/materials', 'emoji'),
('part2', 3, 'staff_attentiveness', 'Attentiveness and support of staff', 'emoji'),
('part2', 4, 'accessibility_convenience', 'Accessibility and convenience of location', 'emoji'),
('part2', 5, 'maintenance_upkeep', 'Maintenance and upkeep of the facility', 'emoji'),
('part2', 6, 'staff_responsiveness', 'Responsiveness of staff to parents'' concerns', 'emoji'),
('part3', 0, 'staff_eval_attentiveness', 'Attentiveness and support of staff', 'emoji'),
('part3', 1, 'staff_eval_friendliness', 'Friendliness and courtesy', 'emoji'),
('part3', 2, 'staff_eval_responsiveness', 'Responsiveness to parents'' concerns', 'emoji'),
('part4', 0, 'overall_satisfaction', 'How satisfied are you with your overall experience using the Child-Minding Station?', 'satisfaction')
on conflict (key) do update set
  part = EXCLUDED.part,
  sort_order = EXCLUDED.sort_order,
  label = EXCLUDED.label,
  answer_type = EXCLUDED.answer_type;

-- 7) Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text,
  user_level text not null default 'assistant' check (user_level in ('admin', 'assistant')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users enable row level security;
drop policy if exists "Allow read users" on public.users;
create policy "Allow read users" on public.users for select using (true);

-- Permissions for all tables
grant all on all tables in schema public to anon, authenticated, service_role;
