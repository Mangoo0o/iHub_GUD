-- Migration to separate first name and last name
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS last_name text;

-- Optional: Migrate existing data
-- UPDATE public.registrations 
-- SET first_name = split_part(parent_name, ' ', 1),
--     last_name = substr(parent_name, strpos(parent_name, ' ') + 1)
-- WHERE first_name IS NULL AND parent_name IS NOT NULL;
