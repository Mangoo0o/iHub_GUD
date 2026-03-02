-- Add missing columns to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS activities text;

-- Optional: If you want to sync parent_name for existing records
-- This splits the parent_name into first_name and last_name (assuming "First Last" format)
UPDATE public.registrations 
SET first_name = split_part(parent_name, ' ', 1),
    last_name = substr(parent_name, strpos(parent_name, ' ') + 1)
WHERE (first_name IS NULL OR first_name = '') AND parent_name IS NOT NULL;
