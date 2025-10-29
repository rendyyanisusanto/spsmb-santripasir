-- Tabel untuk menyimpan data lembaga pendidikan
CREATE TABLE IF NOT EXISTS lembaga (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama VARCHAR(255) NOT NULL UNIQUE,
    no_hp VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_lembaga_nama ON lembaga(nama);

-- Enable Row Level Security (RLS)
ALTER TABLE lembaga ENABLE ROW LEVEL SECURITY;

-- Policy untuk mengizinkan akses untuk authenticated users
CREATE POLICY "Enable access for authenticated users" ON lembaga
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert data default lembaga
INSERT INTO lembaga (nama, no_hp) VALUES 
('SD Negeri 1 Pasir', '081234567890'),
('SMP Negeri 1 Pasir', '081234567891'),
('SMA Negeri 1 Pasir', '081234567892'),
('SMK Negeri 1 Pasir', '081234567893'),
('Pondok Pesantren Al-Hikmah', '081234567894'),
('Madrasah Ibtidaiyah Pasir', '081234567895'),
('Madrasah Tsanawiyah Pasir', '081234567896'),
('Madrasah Aliyah Pasir', '081234567897')
ON CONFLICT (nama) DO NOTHING;