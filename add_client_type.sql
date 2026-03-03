-- Add client_type column to registrations table
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'Internal';
