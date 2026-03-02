import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!url || !key) {
  console.warn('Supabase URL or Anon Key is missing. Database features will be disabled.');
}

export const supabase = url && key ? createClient(url, key) : null;
