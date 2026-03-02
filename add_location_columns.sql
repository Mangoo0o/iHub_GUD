-- Migration script to add new fields to the registrations table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS service_availed text,
ADD COLUMN IF NOT EXISTS province text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS barangay text;

-- Optional: Update basic_info_fields metadata if your app uses it
-- INSERT INTO public.basic_info_fields (key, sort_order, label, field_type, required) VALUES
-- ('province', 8, 'Province', 'select', false),
-- ('city', 9, 'City/Municipality', 'select', false),
-- ('barangay', 10, 'Barangay', 'select', false)
-- ON CONFLICT (key) DO NOTHING;
