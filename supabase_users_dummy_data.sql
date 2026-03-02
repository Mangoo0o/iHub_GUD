    -- Dummy users data for testing User Management
    -- Run in Supabase SQL Editor after supabase_users_table.sql or supabase_setup.sql
    -- Note: In production, passwords should be properly hashed using bcrypt or Supabase Auth

    -- Insert dummy users
    -- Password hashes are placeholders - replace with actual bcrypt hashes in production
    -- For testing: you can use online bcrypt generators or implement hashing in your application

    insert into public.users (username, email, password_hash, user_level, is_active) values
    ('admin', 'admin@ihub.dost.gov.ph', '$2a$10$placeholder_hash_replace_in_production', 'admin', true),
    ('assistant1', 'assistant1@ihub.dost.gov.ph', '$2a$10$placeholder_hash_replace_in_production', 'assistant', true),
    ('assistant2', 'assistant2@ihub.dost.gov.ph', '$2a$10$placeholder_hash_replace_in_production', 'assistant', true),
    ('manager', 'manager@ihub.dost.gov.ph', '$2a$10$placeholder_hash_replace_in_production', 'admin', true),
    ('staff1', 'staff1@ihub.dost.gov.ph', '$2a$10$placeholder_hash_replace_in_production', 'assistant', false)
    on conflict (username) do nothing;

    -- Note: To generate proper bcrypt hashes, you can use:
    -- - Online tools: https://bcrypt-generator.com/
    -- - Node.js: const bcrypt = require('bcrypt'); const hash = await bcrypt.hash('password', 10);
    -- - Or use Supabase Auth for proper authentication
