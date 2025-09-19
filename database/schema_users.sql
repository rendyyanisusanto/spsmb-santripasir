-- Schema untuk sistem users dan roles
-- Jalankan di Supabase SQL Editor

-- Tabel users untuk authentication dan authorization
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'lembaga')),
    lembaga_akses VARCHAR(20) CHECK (lembaga_akses IN ('SD', 'SMP', 'SMA', 'SMK', 'Non Formal') OR lembaga_akses IS NULL),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_lembaga_akses ON users(lembaga_akses);

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tambahkan kolom user_id ke tabel pendaftar untuk tracking
ALTER TABLE pendaftar 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Insert default superadmin (password: admin123)
-- Password hash untuk 'admin123' menggunakan bcrypt
INSERT INTO users (username, email, password_hash, full_name, role, lembaga_akses) 
VALUES (
    'superadmin', 
    'superadmin@santripasir.com', 
    '$2b$10$ZisE1SOA42vjCE1r/yyL3u5vvk5cBYsuttO0tTI8/tPDra8hXbEyW', -- admin123
    'Super Administrator',
    'superadmin',
    NULL
) ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- Insert contoh admin
INSERT INTO users (username, email, password_hash, full_name, role, lembaga_akses) 
VALUES (
    'admin', 
    'admin@santripasir.com', 
    '$2b$10$ZisE1SOA42vjCE1r/yyL3u5vvk5cBYsuttO0tTI8/tPDra8hXbEyW', -- admin123
    'Administrator',
    'admin',
    NULL
) ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- Insert contoh user lembaga
INSERT INTO users (username, email, password_hash, full_name, role, lembaga_akses) 
VALUES 
    ('smp_admin', 'smp@santripasir.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin SMP', 'lembaga', 'SMP'),
    ('sma_admin', 'sma@santripasir.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin SMA', 'lembaga', 'SMA'),
    ('smk_admin', 'smk@santripasir.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin SMK', 'lembaga', 'SMK')
ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendaftar ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk tabel users
-- Superadmin bisa akses semua
CREATE POLICY "Superadmin can access all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'superadmin' AND u.is_active = true
        )
    );

-- User bisa lihat data sendiri
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (id = auth.uid());

-- User bisa update data sendiri (kecuali role dan lembaga_akses)
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (id = auth.uid());

-- RLS Policies untuk tabel pendaftar
-- Superadmin dan admin bisa akses semua
CREATE POLICY "Superadmin and admin can access all pendaftar" ON pendaftar
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('superadmin', 'admin') 
            AND u.is_active = true
        )
    );

-- User lembaga hanya bisa akses sesuai lembaganya
CREATE POLICY "Lembaga users can access own lembaga pendaftar" ON pendaftar
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'lembaga' 
            AND u.lembaga_akses = lembaga_pendidikan
            AND u.is_active = true
        )
    );

-- Function untuk validasi role
CREATE OR REPLACE FUNCTION validate_user_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika role = lembaga, maka lembaga_akses harus diisi
    IF NEW.role = 'lembaga' AND NEW.lembaga_akses IS NULL THEN
        RAISE EXCEPTION 'User dengan role lembaga harus memiliki lembaga_akses';
    END IF;
    
    -- Jika role = superadmin atau admin, lembaga_akses harus NULL
    IF NEW.role IN ('superadmin', 'admin') AND NEW.lembaga_akses IS NOT NULL THEN
        RAISE EXCEPTION 'User dengan role % tidak boleh memiliki lembaga_akses', NEW.role;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_user_role_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_role();