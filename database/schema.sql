-- Tabel untuk menyimpan data pendaftaran PPDB
CREATE TABLE IF NOT EXISTS pendaftaran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    no_hp VARCHAR(20) NOT NULL,
    lembaga_pendidikan VARCHAR(50) NOT NULL CHECK (lembaga_pendidikan IN ('SD', 'SMP', 'SMA', 'SMK', 'Non Sekolah')),
    nama_wali VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_pendaftaran_created_at ON pendaftaran(created_at);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_lembaga ON pendaftaran(lembaga_pendidikan);

-- Enable Row Level Security (RLS)
ALTER TABLE pendaftaran ENABLE ROW LEVEL SECURITY;

-- Policy untuk mengizinkan insert dari public
CREATE POLICY "Enable insert for all users" ON pendaftaran
    FOR INSERT WITH CHECK (true);

-- Policy untuk mengizinkan select dari public (untuk keperluan admin atau laporan)
CREATE POLICY "Enable read access for all users" ON pendaftaran
    FOR SELECT USING (true);