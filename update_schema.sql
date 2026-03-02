-- Database Cleanup and Setup (Clean Slate)

-- 1. Remove unnecessary/old tables
DROP TABLE IF EXISTS public.feedback_submissions CASCADE;
DROP TABLE IF EXISTS public.answers CASCADE; -- if any
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.evaluations CASCADE;

-- 2. Create 'registrations' table (Basic Info + Code)
CREATE TABLE public.registrations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  parent_name text,
  sex text,
  country_code text,
  contact_number text,
  office_unit_address text,
  office_unit_other text,
  date_of_use date,
  children jsonb default '[]'::jsonb,
  service_availed text,
  province text,
  city text,
  barangay text,
  created_at timestamptz default now()
);

-- 3. Create 'evaluations' table (Linked to Registration)
CREATE TABLE public.evaluations (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id), -- Foreign Key Link
  answers jsonb default '{}'::jsonb,
  comments text,
  created_at timestamptz default now()
);

-- 4. Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Open Access for Kiosk Mode)
CREATE POLICY "Allow public insert registrations" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select registrations" ON public.registrations FOR SELECT USING (true); -- needed for code lookup

CREATE POLICY "Allow public insert evaluations" ON public.evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select evaluations" ON public.evaluations FOR SELECT USING (true);

-- 6. Grant Permissions
GRANT ALL ON TABLE public.registrations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.evaluations TO anon, authenticated, service_role;

-- 7. (Optional) Keep Metadata tables if needed (basic_info_fields, form_parts, questions, users)
-- They are separate and useful for frontend configuration.
