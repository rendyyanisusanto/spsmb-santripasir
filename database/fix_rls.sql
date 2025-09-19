-- Schema untuk users table tanpa RLS (untuk development)
-- Jalankan di Supabase SQL Editor

-- Drop policies yang bermasalah
DROP POLICY IF EXISTS "Superadmin can access all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Superadmin and admin can access all pendaftar" ON pendaftar;
DROP POLICY IF EXISTS "Lembaga can access own pendaftar" ON pendaftar;

-- Disable RLS untuk development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE pendaftar DISABLE ROW LEVEL SECURITY;

-- Update password hash untuk user yang sudah ada
UPDATE users 
SET password_hash = '$2b$10$ZisE1SOA42vjCE1r/yyL3u5vvk5cBYsuttO0tTI8/tPDra8hXbEyW'
WHERE username IN ('admin', 'superadmin');

-- Pastikan user ada, kalau belum buat baru
INSERT INTO users (username, email, password_hash, full_name, role, lembaga_akses, is_active) 
VALUES 
    ('superadmin', 'superadmin@santripasir.com', '$2b$10$ZisE1SOA42vjCE1r/yyL3u5vvk5cBYsuttO0tTI8/tPDra8hXbEyW', 'Super Administrator', 'superadmin', NULL, true),
    ('admin', 'admin@santripasir.com', '$2b$10$ZisE1SOA42vjCE1r/yyL3u5vvk5cBYsuttO0tTI8/tPDra8hXbEyW', 'Administrator', 'admin', NULL, true)
ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_active = EXCLUDED.is_active;