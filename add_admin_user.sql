-- Add a new admin user
-- Email: admin
-- Password: admin
-- Note: If your browser prevents logging in without an '@' in the email field, 
-- you can change 'admin' below to something like 'admin@example.com'

INSERT INTO public.users (username, email, password_hash, user_level, is_active)
VALUES ('admin_new', 'admin', 'admin', 'admin', true)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  user_level = EXCLUDED.user_level,
  is_active = EXCLUDED.is_active;
