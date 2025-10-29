-- Migration: Add lembaga_id to users and pendaftar tables
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom lembaga_id ke tabel users sebagai foreign key ke tabel lembaga
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS lembaga_id UUID REFERENCES lembaga(id);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_lembaga_id ON users(lembaga_id);

-- 2. Tambah kolom lembaga_id ke tabel pendaftar
ALTER TABLE pendaftar 
ADD COLUMN IF NOT EXISTS lembaga_id UUID REFERENCES lembaga(id);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_pendaftar_lembaga_id ON pendaftar(lembaga_id);

-- Optional: Migrate data dari lembaga_akses/lembaga_pendidikan ke lembaga_id jika diperlukan
-- Untuk users:
-- UPDATE users SET lembaga_id = (SELECT id FROM lembaga WHERE nama = users.lembaga_akses) WHERE lembaga_akses IS NOT NULL;

-- Untuk pendaftar (mapping manual berdasarkan nama lembaga yang mirip):
-- UPDATE pendaftar SET lembaga_id = (
--     SELECT id FROM lembaga 
--     WHERE nama ILIKE '%' || pendaftar.lembaga_pendidikan || '%' 
--     LIMIT 1
-- ) WHERE lembaga_pendidikan IS NOT NULL;

-- Optional: Drop kolom lama jika sudah tidak diperlukan
-- ALTER TABLE users DROP COLUMN IF EXISTS lembaga_akses;
-- ALTER TABLE pendaftar DROP COLUMN IF EXISTS lembaga_pendidikan;