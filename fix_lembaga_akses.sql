-- Run this SQL to check and add lembaga_akses column if it's missing
-- This should already exist based on schema_users.sql, but run this to verify

-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('lembaga_akses', 'lembaga_id');

-- If lembaga_akses doesn't exist, add it:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS lembaga_akses VARCHAR(20) CHECK (lembaga_akses IN ('SD', 'SMP', 'SMA', 'SMK', 'Non Formal') OR lembaga_akses IS NULL);

-- Then populate lembaga_akses based on lembaga_id mapping:
-- UPDATE users u
-- SET lembaga_akses = l.nama
-- FROM lembaga l
-- WHERE u.lembaga_id = l.id AND u.lembaga_akses IS NULL;
