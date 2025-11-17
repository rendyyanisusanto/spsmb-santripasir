-- Fix RLS Policy untuk berkas_santri
-- Policy lama menggunakan auth.uid() yang tidak compatible dengan JWT custom
-- Policy baru membolehkan akses penuh karena authorization sudah di handle di API layer

-- Drop existing policies
DROP POLICY IF EXISTS "Superadmin and admin can access all berkas_santri" ON berkas_santri;
DROP POLICY IF EXISTS "Lembaga can access own berkas_santri" ON berkas_santri;

-- Buat policy baru yang allow all (karena auth sudah di handle di API)
-- Ini aman karena kita sudah implement authenticate() dan authorize() di API routes
CREATE POLICY "Allow all access to berkas_santri" ON berkas_santri
FOR ALL USING (true);

-- Alternatif: Disable RLS (uncomment jika mau disable RLS sepenuhnya)
-- ALTER TABLE berkas_santri DISABLE ROW LEVEL SECURITY;
