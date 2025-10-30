-- Schema untuk tabel berkas_santri
-- Pastikan tabel ini ada di database Supabase

CREATE TABLE IF NOT EXISTS berkas_santri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id UUID REFERENCES santri(id) ON DELETE CASCADE,
  jenis_berkas TEXT NOT NULL, -- KK, Akta, Ijazah, dll
  file_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_berkas_santri_santri_id ON berkas_santri(santri_id);
CREATE INDEX IF NOT EXISTS idx_berkas_santri_jenis ON berkas_santri(jenis_berkas);

-- RLS policies untuk berkas_santri
ALTER TABLE berkas_santri ENABLE ROW LEVEL SECURITY;

-- Policy untuk superadmin dan admin dapat akses semua berkas
CREATE POLICY IF NOT EXISTS "Superadmin and admin can access all berkas_santri" ON berkas_santri
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('superadmin', 'admin') 
    AND u.is_active = true
  )
);

-- Policy untuk lembaga hanya dapat akses berkas santri dari lembaganya
CREATE POLICY IF NOT EXISTS "Lembaga can access own berkas_santri" ON berkas_santri
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN santri s ON s.lembaga_id = u.lembaga_id
    WHERE u.id = auth.uid() 
    AND u.role = 'lembaga' 
    AND u.is_active = true
    AND s.id = berkas_santri.santri_id
  )
);

-- Comments
COMMENT ON TABLE berkas_santri IS 'Tabel untuk menyimpan berkas-berkas santri';
COMMENT ON COLUMN berkas_santri.jenis_berkas IS 'Jenis berkas: KK, Akta, Ijazah, Foto, dll';
COMMENT ON COLUMN berkas_santri.file_url IS 'URL file yang tersimpan di Supabase Storage';