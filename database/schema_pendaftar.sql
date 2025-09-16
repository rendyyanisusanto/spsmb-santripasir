-- Tabel untuk menyimpan data pendaftaran PPDB (nama tabel: pendaftar)
CREATE TABLE IF NOT EXISTS pendaftar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    jenis_kelamin VARCHAR(10) NOT NULL CHECK (jenis_kelamin IN ('Pria', 'Wanita')),
    no_hp VARCHAR(20) NOT NULL,
    nama_wali VARCHAR(255) NOT NULL,
    alamat TEXT NOT NULL,
    lembaga_pendidikan VARCHAR(50) NOT NULL CHECK (lembaga_pendidikan IN ('SD', 'SMP', 'SMA', 'SMK', 'Non Formal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_pendaftar_created_at ON pendaftar(created_at);
CREATE INDEX IF NOT EXISTS idx_pendaftar_lembaga ON pendaftar(lembaga_pendidikan);

-- Enable Row Level Security (RLS)
ALTER TABLE pendaftar ENABLE ROW LEVEL SECURITY;

-- Policy untuk mengizinkan insert dari public
CREATE POLICY "Enable insert for all users" ON pendaftar
    FOR INSERT WITH CHECK (true);

-- Policy untuk mengizinkan select dari public (untuk keperluan admin atau laporan)
CREATE POLICY "Enable read access for all users" ON pendaftar
    FOR SELECT USING (true);